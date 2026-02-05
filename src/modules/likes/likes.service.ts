import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/infra/queues'
import { clientMongodb } from '~/database/mongodb.db'
import cacheService from '~/helpers/cache.helper'
import { CONSTANT_JOB } from '~/shared/constants'
import { ParamIdTweetDto } from '~/modules/tweets/tweets.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { logger } from '~/utils/logger.util'
import { NotFoundError } from '~/core/error.response'
import TweetsService from '~/modules/tweets/tweets.service'
import { LikesCollection } from './likes.schema'
import { TweetsCollection } from '../tweets/tweets.schema'

class LikesService {
  async toggleLike(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleLike> {
    const { tweet_id } = payload

    // Dùng Hash Tag {tw:${tweet_id}} để tất cả key liên quan đến tweet này cùng slot
    const key_cache_tw_d = `{tw:${tweet_id}}:details`
    const key_cache_tw_likes = `{tw:${tweet_id}}:likes`
    const key_cache_tw_likes_count = `{tw:${tweet_id}}:count`
    const key_cache_tw_sync_status = `{tw:${tweet_id}}:sync_status`

    // Key queue là global → KHÔNG dùng hash tag
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
      pipeline.hset(key_cache_tw_sync_status, user_id, '0') // 0 = Unlike
    } else {
      // LIKE
      newCount = newCount + 1
      pipeline.sadd(key_cache_tw_likes, user_id)
      pipeline.set(key_cache_tw_likes_count, newCount.toString())
      pipeline.hset(key_cache_tw_sync_status, user_id, '1') // 1 = Like
    }

    // Cập nhật chi tiết Tweet trong cache nếu đã có
    if (tw_d_cached) {
      tw_d_cached.likes_count = newCount
      if (isMember) {
        tw_d_cached.likes = (tw_d_cached.likes || []).filter((l: any) => l.user_id !== user_id)
      } else {
        tw_d_cached.likes = [...(tw_d_cached.likes || []), { user_id: new ObjectId(user_id) }]
      }
      pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached), 'EX', 300)
    }

    // Thực hiện pipeline trước (chỉ chứa các key cùng slot)
    await pipeline.exec()

    // Tách riêng lệnh đẩy vào queue vì key này nằm ở slot khác
    // Không ảnh hưởng atomicity vì queue chỉ dùng để sync async sau
    await cacheService.lPush(key_cache_tw_like_queue, tweet_id)

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

    //
    const tweet_owner_id = await TweetsService.getUserIdByTweetId(tweet_id)
    if (!tweet_owner_id) {
      throw new NotFoundError('Bài viết không tồn tại')
    }

    Object.entries(users_status).forEach(([uid, status]) => {
      if (status === '0') users_unlike.push(new ObjectId(uid))
      else users_like.push({ user_id: new ObjectId(uid), tweet_id: tweet_obj_id, tweet_owner_id: tweet_owner_id })
    })

    const session = clientMongodb.startSession()
    try {
      await session.withTransaction(async () => {
        // 1. Xử lý Unlike
        if (users_unlike.length > 0) {
          await LikesCollection.deleteMany(
            {
              tweet_id: tweet_obj_id,
              user_id: { $in: users_unlike }
            },
            { session }
          )
        }

        // 2. Xử lý Like
        if (users_like.length > 0) {
          for (const doc of users_like) {
            await LikesCollection.updateOne(
              { tweet_id: doc.tweet_id, user_id: doc.user_id },
              {
                $set: doc,
                $setOnInsert: {
                  created_at: new Date()
                }
              },

              { upsert: true, session }
            )
          }
        }

        // 3. Cập nhật Count chuẩn từ Cache sang DB
        const finalCount = await cacheService.get<string>(key_count)
        await TweetsCollection.updateOne(
          { _id: tweet_obj_id },
          { $set: { likes_count: parseInt(finalCount || '0') } },
          { session }
        )
      })

      // 4. Gửi thông báo (chỉ cho những người mới Like)
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
      // Nếu lỗi, đẩy lại queue để retry
      await cacheService.lPush(key_queue, tweet_id)
    } finally {
      await session.endSession()
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikesCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
