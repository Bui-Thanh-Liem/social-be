import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { BadRequestError } from '~/core/error.response'
import { clientMongodb } from '~/dbs/init.mongodb'
import cacheService from '~/helpers/cache.helper'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { CONSTANT_CHUNK_SIZE, CONSTANT_JOB } from '~/shared/constants'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { chunkArray } from '~/utils/chunk-array'
import { convertObjectId } from '~/utils/convert-object-id'
import {
  createKeyTweetDetails,
  createKeyTweetLikeQueue,
  createKeyTweetLikes,
  createKeyTweetLikesCount,
  createKeyTweetLikesSync
} from '~/utils/create-key-cache.util'

class LikesService {
  async toggleLike(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleLike> {
    const { tweet_id } = payload
    const tweet = await TweetCollection.findOne({ _id: convertObjectId(tweet_id) }, { projection: { _id: 1 } })
    if (!tweet) {
      throw new BadRequestError('Bài viết không tồn tại')
    }

    // Optimistic update cache *****CACHE*****
    // Get cache keys and cached data
    const key_cache_tw_d = createKeyTweetDetails(tweet_id) // tweet details key
    const key_cache_tw_likes = createKeyTweetLikes(tweet_id) // users likes key
    const key_cache_tw_likes_count = createKeyTweetLikesCount() // users likes count key
    const key_cache_tw_like_queue = createKeyTweetLikeQueue() // tweet like queue key
    const key_cache_tw_likes_sync = createKeyTweetLikesSync(tweet_id) // tweet likes sync key

    //
    const tw_d_cached = await cacheService.get<any>(key_cache_tw_d)
    // const tw_likes_cached = await cacheService.sMembers(key_cache_tw_likes)
    const tw_likes_count_cached = await cacheService.hGet(key_cache_tw_likes_count, tweet_id)
    const isMember = await cacheService.sIsMember(key_cache_tw_likes, user_id)

    //
    const pipeline = await cacheService.pipeline()
    const statusInCache = isMember ? '0' : '1'
    if (isMember) {
      try {
        // Update likes & likes_count in cache
        pipeline.sRem(key_cache_tw_likes, user_id)
        pipeline.hIncrBy(key_cache_tw_likes_count, tweet_id, -1)

        // Update cached tweet details
        if (tw_d_cached && tw_d_cached.likes_count !== undefined) {
          tw_d_cached.likes_count = parseInt(tw_likes_count_cached || '0') - 1
          tw_d_cached.likes = tw_d_cached.likes.filter((like: any) => like.user_id.toString() !== user_id)
          pipeline.expire(key_cache_tw_d, 300)
          pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached))
        }
      } catch (error) {
        throw new BadRequestError((error as any)?.message || 'Toggling like in cache failed')
      }
    } else {
      try {
        // Update likes & likes_count in cache

        pipeline.expire(key_cache_tw_likes, 2592000) // 30 days
        pipeline.sAdd(key_cache_tw_likes, user_id)

        pipeline.expire(key_cache_tw_likes_count, 2592000) // 30 days
        pipeline.hIncrBy(key_cache_tw_likes_count, tweet_id, 1)

        //  Update cached tweet details
        if (tw_d_cached && tw_d_cached.likes_count !== undefined) {
          tw_d_cached.likes_count = parseInt(tw_likes_count_cached || '0') + 1
          tw_d_cached.likes = tw_d_cached.likes.concat([{ user_id: new ObjectId(user_id) }])
          pipeline.expire(key_cache_tw_d, 300)
          pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached))
        }
      } catch (error) {
        throw new BadRequestError((error as any)?.message || 'Toggling like in cache failed')
      }
    }

    // Add to like queue for processing later
    await pipeline.lPush(key_cache_tw_like_queue, tweet_id)
    await pipeline.hSet(key_cache_tw_likes_sync, user_id, statusInCache)
    await pipeline.exec()

    // Optimistic update cache *****DB*****
    // Cron job will sync cache to DB later

    //
    if (isMember) {
      return {
        _id: '',
        status: 'UnLike',
        likes_count: tw_d_cached?.likes_count || parseInt(tw_likes_count_cached || '0') - 1
      }
    } else {
      return {
        _id: '',
        status: 'Like',
        likes_count: tw_d_cached?.likes_count || parseInt(tw_likes_count_cached || '0') + 1
      }
    }
  }

  async syncLikesFromCacheToDB() {
    const key_queue = createKeyTweetLikeQueue()
    const tweet_id = await cacheService.rPop(key_queue)
    if (!tweet_id) return

    const key_sync = createKeyTweetLikesSync(tweet_id)
    const users_liked = await cacheService.hGetAll(key_sync)

    // Xóa ngay key sync để tránh xử lý lặp
    await cacheService.del(key_sync)

    if (Object.keys(users_liked).length === 0) return

    const [users_unlike, users_like] = Object.entries(users_liked).reduce(
      (acc, [id, status]) => {
        status === '0' ? acc[0].push(id) : acc[1].push(id)
        return acc
      },
      [[] as string[], [] as string[]]
    )

    const session = clientMongodb.startSession()
    try {
      const tweet_obj_id = new ObjectId(tweet_id)
      const likes_count = await cacheService.hGet(createKeyTweetLikesCount(), tweet_id)

      await session.withTransaction(async () => {
        if (users_unlike.length > 0) {
          await LikeCollection.deleteMany(
            {
              tweet_id: tweet_obj_id,
              user_id: { $in: users_unlike.map((id) => new ObjectId(id)) }
            },
            { session }
          )
        }

        if (users_like.length > 0) {
          const docs = users_like.map((id) => ({ user_id: new ObjectId(id), tweet_id: tweet_obj_id }))
          await LikeCollection.insertMany(docs, { session })
        }

        await TweetCollection.updateOne(
          { _id: tweet_obj_id },
          { $set: { likes_count: Number(likes_count || '0') } },
          { session }
        )
      })

      // Notification logic
      if (users_like.length > 0) {
        const chunks = chunkArray(users_like, CONSTANT_CHUNK_SIZE)
        for (const chunk of chunks) {
          const jobs = chunk.map((uid) => ({
            name: CONSTANT_JOB.SEND_NOTI_LIKE,
            data: { sender_id: uid, tweet_id },
            opts: { removeOnComplete: true, attempts: 3 }
          }))
          await notificationQueue.addBulk(jobs)
        }
      }
    } catch (error) {
      console.error('>>> Sync DB Error:', error)
    } finally {
      await session.endSession()
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
