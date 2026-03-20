import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/infra/queues'
import { clientMongodb } from '~/database/mongodb.db'
import cacheService from '~/helpers/cache.helper'
import { CONSTANT_JOB } from '~/shared/constants'
import { ParamIdTweetDto } from '~/modules/tweets/tweets.dto'
import { logger } from '~/utils/logger.util'
import { NotFoundError } from '~/core/error.response'
import TweetsService from '~/modules/tweets/tweets.service'
import { LikesCollection } from './likes.schema'
import { TweetsCollection } from '../tweets/tweets.schema'
import { ResToggleLike } from './like.dto'

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
    // 1. Lấy tweet_id ra khỏi queue
    const tweet_id = await cacheService.rPop(key_queue)
    if (!tweet_id) return

    const key_sync = `{tw:${tweet_id}}:sync_status`
    const key_processing = `{tw:${tweet_id}}:processing`
    const key_count = `{tw:${tweet_id}}:count`

    try {
      // 2. Kiểm tra và Snapshot dữ liệu bằng RENAME
      // Dùng rename để "đóng băng" danh sách user đang cần sync,
      // tránh việc user mới Like làm sai lệch data đang xử lý.
      const exists = await cacheService.exists(key_sync)
      if (!exists) return
      await cacheService.rename(key_sync, key_processing)

      const users_status = await cacheService.hGetAll(key_processing)
      const uids = Object.keys(users_status)
      if (uids.length === 0) {
        await cacheService.del(key_processing)
        return
      }

      // 3. Chuẩn bị dữ liệu
      const tweet_obj_id = new ObjectId(tweet_id)
      const tweet_owner_id = await TweetsService.getUserIdByTweetId(tweet_id)
      if (!tweet_owner_id) {
        // Nếu tweet không tồn tại, dọn dẹp cache và thoát
        await cacheService.del(key_processing)
        return
      }

      const bulkOps: any[] = []
      const users_to_notify: string[] = []

      for (const [uid, status] of Object.entries(users_status)) {
        const user_obj_id = new ObjectId(uid)

        if (status === '0') {
          // Case: UNLIKE
          bulkOps.push({
            deleteMany: {
              filter: { tweet_id: tweet_obj_id, user_id: user_obj_id }
            }
          })
        } else {
          // Case: LIKE
          users_to_notify.push(uid)
          bulkOps.push({
            updateOne: {
              filter: { tweet_id: tweet_obj_id, user_id: user_obj_id },
              update: {
                $set: {
                  tweet_id: tweet_obj_id,
                  user_id: user_obj_id,
                  tweet_owner_id: new ObjectId(tweet_owner_id)
                },
                $setOnInsert: { created_at: new Date() }
              },
              upsert: true
            }
          })
        }
      }

      // 4. Thực thi Transaction với BulkWrite
      const session = clientMongodb.startSession()
      try {
        await session.withTransaction(async () => {
          // Thực hiện gộp tất cả Like/Unlike vào 1 lần gọi DB
          if (bulkOps.length > 0) {
            await LikesCollection.bulkWrite(bulkOps, { session })
          }

          // Cập nhật số lượng Like chuẩn từ Redis vào Tweet
          const finalCount = await cacheService.get<string>(key_count)
          await TweetsCollection.updateOne(
            { _id: tweet_obj_id },
            { $set: { likes_count: parseInt(finalCount || '0') } },
            { session }
          )
        })

        // 5. Thành công: Xóa key tạm và gửi thông báo
        await cacheService.del(key_processing)

        if (users_to_notify.length > 0) {
          const jobs = users_to_notify.map((uid) => ({
            name: CONSTANT_JOB.SEND_NOTI_LIKE,
            data: { sender_id: uid, tweet_id },
            opts: { removeOnComplete: true, attempts: 3 }
          }))
          await notificationQueue.addBulk(jobs)
        }
      } catch (dbError) {
        logger.error(`DB Transaction Error [Tweet: ${tweet_id}]:`, dbError)
        throw dbError // Đẩy ra ngoài để catch xử lý retry
      } finally {
        await session.endSession()
      }
    } catch (error) {
      logger.error(`>>> Sync DB Error [Tweet: ${tweet_id}]:`, error)

      // 6. Xử lý lỗi: Trả data về lại key_sync để lần sau chạy tiếp
      try {
        const processingExists = await cacheService.exists(key_processing)
        if (processingExists) {
          // Merge hoặc rename ngược lại (tùy cấu trúc Redis của bạn)
          await cacheService.rename(key_processing, key_sync)
        }
        await cacheService.lPush(key_queue, tweet_id)
      } catch (redisError) {
        logger.error('CRITICAL: Could not recovery sync_status key', redisError)
      }
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikesCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
