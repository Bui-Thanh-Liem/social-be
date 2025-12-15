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
        await pipeline.sRem(key_cache_tw_likes, user_id)
        await pipeline.hIncrBy(key_cache_tw_likes_count, tweet_id, -1)

        // Update cached tweet details
        if (tw_d_cached && tw_d_cached.likes_count !== undefined) {
          tw_d_cached.likes_count = parseInt(tw_likes_count_cached || '0') - 1
          tw_d_cached.likes = tw_d_cached.likes.filter((like: any) => like.user_id.toString() !== user_id)
          await pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached), { ttl: 300 })
        }
      } catch (error) {
        throw new BadRequestError((error as any)?.message || 'Toggling like in cache failed')
      }
    } else {
      try {
        // Update likes & likes_count in cache
        await pipeline.sAdd(key_cache_tw_likes, user_id, { ttl: 2592000 }) // 30 days
        await pipeline.hIncrBy(key_cache_tw_likes_count, tweet_id, 1, { ttl: 2592000 }) // 30 days

        //  Update cached tweet details
        if (tw_d_cached && tw_d_cached.likes_count !== undefined) {
          tw_d_cached.likes_count = parseInt(tw_likes_count_cached || '0') + 1
          tw_d_cached.likes = tw_d_cached.likes.concat([{ user_id: new ObjectId(user_id) }])
          await pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached), { ttl: 300 })
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
    // Pop tweet_id from like queue
    const key_cache_tw_like_queue = createKeyTweetLikeQueue()
    const tweet_id = await cacheService.rPop(key_cache_tw_like_queue)
    if (!tweet_id) return // no tweet to process

    // Get user_ids & their like status from likes sync hash
    const key_cache_tw_likes_sync = createKeyTweetLikesSync(tweet_id)
    const users_liked = await cacheService.hGetAll(key_cache_tw_likes_sync)
    await cacheService.del(key_cache_tw_likes_sync)
    if (Object.keys(users_liked).length === 0) return // no user to process

    //
    const [users_unlike, users_like] = Object.entries(users_liked).reduce(
      (acc, [user_id, status]) => {
        if (status === '0') acc[0].push(user_id)
        else acc[1].push(user_id)
        return acc
      },
      [[] as string[], [] as string[]]
    )

    const session = clientMongodb.startSession()
    try {
      // Prepare object IDs
      const tweet_obj_id = new ObjectId(tweet_id)

      //
      const key_cache_tw_likes_count = createKeyTweetLikesCount()
      const likes_count = await cacheService.hGet(key_cache_tw_likes_count, tweet_id)

      //
      await session.withTransaction(async () => {
        // Unlike existed → deleted successfully (UnLike)
        if (users_unlike.length > 0) {
          const dataHandle = users_unlike.map((user_id) => ({
            user_id: new ObjectId(user_id),
            tweet_id: tweet_obj_id
          }))
          for (const data of dataHandle) {
            await LikeCollection.deleteMany(data, { session })
          }
        }

        // Like didn’t exist → add new like (Like)
        if (users_like.length > 0) {
          const dataHandle = users_like.map((user_id) => ({
            user_id: new ObjectId(user_id),
            tweet_id: tweet_obj_id
          }))
          await LikeCollection.insertMany(dataHandle, { session })
        }

        // Update likes_count in Tweet collection
        await TweetCollection.findOneAndUpdate(
          { _id: convertObjectId(tweet_id) },
          { $set: { likes_count: Number(likes_count || '0') } },
          {
            session
          }
        )
      })

      // Send notification to tweet owner
      if (users_like?.length > 0) {
        if (users_like.length > CONSTANT_CHUNK_SIZE) {
          // Send in chunks
          const chunks = chunkArray(users_like, CONSTANT_CHUNK_SIZE)
          for (const chunk of chunks) {
            const jobs = chunk.map((user_id) => ({
              name: CONSTANT_JOB.SEND_NOTI_LIKE,
              data: {
                sender_id: user_id,
                tweet_id: tweet_id
              },
              opts: {
                removeOnComplete: true,
                attempts: 3 // retry nếu queue bị lỗi
              }
            }))
            await notificationQueue.addBulk(jobs)
          }
        }
      }
    } catch (error) {
      throw new BadRequestError((error as any)?.message || 'Sync likes from cache to DB failed')
    } finally {
      await session.endSession()
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
