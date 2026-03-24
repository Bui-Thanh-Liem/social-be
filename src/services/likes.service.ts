import { ObjectId } from 'mongodb'
import { clientMongodb } from '~/database/mongodb.db'
import { ResToggleLike } from '~/dtos/like.dto'
import { ParamIdTweetDto } from '~/dtos/tweets.dto'
import cacheService from '~/helpers/cache.helper'
import { notificationQueue } from '~/infra/queues'
import { LikesCollection } from '~/models/likes.schema'
import { TweetsCollection } from '~/models/tweets.schema'
import TweetsService from '~/services/tweets.service'
import { CONSTANT_JOB } from '~/shared/constants'
import { logger } from '~/utils/logger.util'

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

    // 1. LẤY TẤT CẢ TWEET_ID ĐANG ĐỢI (Batching)
    const tweetIds = await cacheService.lRangeAndTrim(key_queue)

    if (tweetIds.length === 0) return

    logger.info(`Starting sync for ${tweetIds.length} tweets`)

    // 2. Xử lý từng tweet (Có thể dùng Promise.all để nhanh hơn nếu số lượng tweet vừa phải)
    for (const tweet_id of tweetIds) {
      const key_sync = `{tw:${tweet_id}}:sync_status`
      const key_processing = `{tw:${tweet_id}}:processing`
      const key_count = `{tw:${tweet_id}}:count`

      try {
        // Snapshot dữ liệu của Tweet này
        const exists = await cacheService.exists(key_sync)
        if (!exists) continue

        await cacheService.rename(key_sync, key_processing)
        const users_status = await cacheService.hGetAll(key_processing)
        const uids = Object.keys(users_status)
        if (uids.length === 0) {
          await cacheService.del(key_processing)
          continue
        }

        const tweet_obj_id = new ObjectId(tweet_id)
        const tweet_owner_id = await TweetsService.getUserIdByTweetId(tweet_id)
        if (!tweet_owner_id) {
          await cacheService.del(key_processing)
          continue
        }

        // Gom tất cả Like/Unlike của Tweet này vào BulkWrite
        const bulkOps: any[] = []
        const users_to_notify: string[] = []

        for (const [uid, status] of Object.entries(users_status)) {
          const user_obj_id = new ObjectId(uid)
          if (status === '0') {
            bulkOps.push({
              deleteMany: { filter: { tweet_id: tweet_obj_id, user_id: user_obj_id } }
            })
          } else {
            users_to_notify.push(uid)
            bulkOps.push({
              updateOne: {
                filter: { tweet_id: tweet_obj_id, user_id: user_obj_id },
                update: {
                  $set: { tweet_id: tweet_obj_id, user_id: user_obj_id, tweet_owner_id: new ObjectId(tweet_owner_id) },
                  $setOnInsert: { created_at: new Date() }
                },
                upsert: true
              }
            })
          }
        }

        const session = clientMongodb.startSession()
        try {
          await session.withTransaction(async () => {
            if (bulkOps.length > 0) {
              await LikesCollection.bulkWrite(bulkOps, { session })
            }
            const finalCount = await cacheService.get<string>(key_count)
            await TweetsCollection.updateOne(
              { _id: tweet_obj_id },
              { $set: { likes_count: parseInt(finalCount || '0') } },
              { session }
            )
          })

          await cacheService.del(key_processing)

          // Gửi thông báo theo lô
          if (users_to_notify.length > 0) {
            const jobs = users_to_notify.map((uid) => ({
              name: CONSTANT_JOB.SEND_NOTI_LIKE,
              data: { sender_id: uid, tweet_id },
              opts: { removeOnComplete: true, attempts: 3 }
            }))
            await notificationQueue.addBulk(jobs)
          }
        } catch (innerError) {
          logger.error(`Transaction error for tweet ${tweet_id}:`, innerError)
          throw innerError
        } finally {
          await session.endSession()
        }
      } catch (error) {
        logger.error(`Error syncing tweet ${tweet_id}:`, error)
        // Trả lại ID vào queue để lần sau quét lại
        await cacheService.lPush(key_queue, tweet_id)
        // Trả lại data sync_status nếu có thể
        if (await cacheService.exists(key_processing)) {
          await cacheService.rename(key_processing, key_sync)
        }
      }
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikesCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
