import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { clientMongodb } from '~/dbs/init.mongodb'
import cacheService from '~/helpers/cache.helper'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { logger } from '~/utils/logger.util'

class LikesService {
  async toggleLike(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleLike> {
    const { tweet_id } = payload

    // Dùng Hash Tag {tweet_id} cho TẤT CẢ các key liên quan đến tweet này
    // Việc này đảm bảo Pipeline chạy được trên Cluster mà không bị lỗi CROSSSLOT
    const key_cache_tw_d = `{tw:${tweet_id}}:details`
    const key_cache_tw_likes = `{tw:${tweet_id}}:likes`
    const key_cache_tw_likes_count = `{tw:${tweet_id}}:count`
    const key_cache_tw_sync_status = `{tw:${tweet_id}}:sync_status` // Thay cho hash sync toàn cục

    // Key Queue có thể để riêng vì nó là hàng đợi xử lý chung
    const key_cache_tw_like_queue = `tweet_like_sync_queue`

    const [tw_d_cached, isMember, currentCount] = await Promise.all([
      cacheService.get<any>(key_cache_tw_d),
      cacheService.sIsMember(key_cache_tw_likes, user_id),
      cacheService.get<string>(key_cache_tw_likes_count)
    ])

    const pipeline = cacheService.pipeline()
    let newCount = parseInt(currentCount || '0')

    if (isMember) {
      // UNLIKE
      newCount = Math.max(0, newCount - 1)
      pipeline.srem(key_cache_tw_likes, user_id)
      pipeline.set(key_cache_tw_likes_count, newCount.toString())
      pipeline.hset(key_cache_tw_sync_status, user_id, '0') // 0 là Unlike
    } else {
      // LIKE
      newCount = newCount + 1
      pipeline.sadd(key_cache_tw_likes, user_id)
      pipeline.set(key_cache_tw_likes_count, newCount.toString())
      pipeline.hset(key_cache_tw_sync_status, user_id, '1') // 1 là Like
    }

    // Cập nhật chi tiết Tweet trong cache nếu có
    if (tw_d_cached) {
      tw_d_cached.likes_count = newCount
      if (isMember) {
        tw_d_cached.likes = (tw_d_cached.likes || []).filter((l: any) => l.user_id !== user_id)
      } else {
        tw_d_cached.likes = [...(tw_d_cached.likes || []), { user_id: new ObjectId(user_id) }]
      }
      pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached), 'EX', 300)
    }

    // Đẩy vào queue để Cronjob sync DB
    pipeline.lpush(key_cache_tw_like_queue, tweet_id)

    await pipeline.exec()

    return {
      _id: '',
      status: isMember ? 'UnLike' : 'Like',
      likes_count: newCount
    }
  }

  async syncLikesFromCacheToDB() {
    const key_queue = `tweet_like_sync_queue`
    const tweet_id = await cacheService.rPop(key_queue)
    if (!tweet_id) return

    const key_sync = `{tw:${tweet_id}}:sync_status`
    const key_count = `{tw:${tweet_id}}:count`

    // Lấy dữ liệu thay đổi
    const users_status = await cacheService.hGetAll(key_sync)
    if (Object.keys(users_status).length === 0) return

    // Xóa sync status ngay để tránh job sau xử lý đè
    await cacheService.del(key_sync)

    const users_unlike: ObjectId[] = []
    const users_like: any[] = []
    const tweet_obj_id = new ObjectId(tweet_id)

    Object.entries(users_status).forEach(([uid, status]) => {
      if (status === '0') users_unlike.push(new ObjectId(uid))
      else users_like.push({ user_id: new ObjectId(uid), tweet_id: tweet_obj_id })
    })

    const session = clientMongodb.startSession()
    try {
      await session.withTransaction(async () => {
        // 1. Xử lý Unlike
        if (users_unlike.length > 0) {
          await LikeCollection.deleteMany(
            {
              tweet_id: tweet_obj_id,
              user_id: { $in: users_unlike }
            },
            { session }
          )
        }

        // 2. Xử lý Like
        if (users_like.length > 0) {
          // Dùng update/upsert để tránh lỗi duplicate key nếu sync lỗi
          for (const doc of users_like) {
            await LikeCollection.updateOne(
              { tweet_id: doc.tweet_id, user_id: doc.user_id },
              { $set: doc },
              { upsert: true, session }
            )
          }
        }

        // 3. Cập nhật Count chuẩn từ Cache sang DB
        const finalCount = await cacheService.get<string>(key_count)
        await TweetCollection.updateOne(
          { _id: tweet_obj_id },
          { $set: { likes_count: parseInt(finalCount || '0') } },
          { session }
        )
      })

      // 4. Gửi thông báo (Chỉ gửi cho những người mới Like)
      if (users_like.length > 0) {
        const jobs = users_like.map((doc) => ({
          name: CONSTANT_JOB.SEND_NOTI_LIKE,
          data: { sender_id: doc.user_id.toString(), tweet_id },
          opts: { removeOnComplete: true, attempts: 3 }
        }))
        await notificationQueue.addBulk(jobs)
      }
    } catch (error) {
      logger.error('>>> Sync DB Error:', error)
      // Nếu lỗi, có thể đẩy ngược lại queue để xử lý lại
      await cacheService.lPush(key_queue, tweet_id)
    } finally {
      await session.endSession()
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
