import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { BadRequestError } from '~/core/error.response'
import { clientMongodb } from '~/dbs/init.mongodb'
import cacheService from '~/helpers/cache.helper'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { CreateNotiLikeDto } from '~/shared/dtos/req/notification.dto'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { convertObjectId } from '~/utils/convert-object-id'
import { createKeyTweetDetails, createKeyTweetLikes, createKeyTweetLikesCount } from '~/utils/create-key-cache.util'

class LikesService {
  async toggleLike(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleLike> {
    const { tweet_id } = payload

    // optimistic update cache *****CACHE*****
    // Get cache keys and cached data
    const key_cache_tw_d = createKeyTweetDetails(tweet_id) // tweet details key
    const key_cache_tw_likes = createKeyTweetLikes(tweet_id) // users likes key
    const key_cache_tw_likes_count = createKeyTweetLikesCount() // users likes count key
    const tw_d_cached = await cacheService.get<any>(key_cache_tw_d)
    // const tw_likes_cached = await cacheService.sMembers(key_cache_tw_likes)
    const tw_likes_count_cached = await cacheService.hGet(key_cache_tw_likes_count, tweet_id)

    //
    const isMember = await cacheService.sIsMember(key_cache_tw_likes, user_id)

    //
    const pipeline = await cacheService.pipeline()
    if (isMember) {
      try {
        // Update likes & likes_count in cache
        await pipeline.sRem(key_cache_tw_likes, user_id)
        await pipeline.hIncrBy(key_cache_tw_likes_count, tweet_id, -1)

        // Update cached tweet details
        if (tw_d_cached && tw_d_cached.likes_count !== undefined) {
          tw_d_cached.likes_count = parseInt(tw_likes_count_cached || '0') - 1
          tw_d_cached.likes = tw_d_cached.likes.concat([{ user_id: new ObjectId(user_id) }])
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
          tw_d_cached.likes = tw_d_cached.likes.filter((like: any) => like.user_id.toString() !== user_id)
          await pipeline.set(key_cache_tw_d, JSON.stringify(tw_d_cached), { ttl: 300 })
        }
      } catch (error) {
        throw new BadRequestError((error as any)?.message || 'Toggling like in cache failed')
      }
    }
    pipeline.exec()

    // Check and delete if like exists  *****DB***** sẽ làm ở Queue sau (write-behind cache)
    const session = clientMongodb.startSession()
    try {
      // Prepare object IDs
      const user_Obj_id = new ObjectId(user_id)
      const tweet_obj_id = new ObjectId(tweet_id)

      // data handle
      const dataHandle = {
        user_id: user_Obj_id,
        tweet_id: tweet_obj_id
      }

      return await session.withTransaction(async () => {
        const deleted = await LikeCollection.findOneAndDelete(dataHandle, { session })

        // Like existed → deleted successfully (UnLike)
        if (deleted?._id) {
          // Update likes_count in Tweet collection
          const updatedTweet = await TweetCollection.findOneAndUpdate(
            { _id: convertObjectId(tweet_id) },
            { $inc: { likes_count: -1 } },
            {
              returnDocument: 'after',
              projection: {
                likes_count: 1
              },
              session
            }
          )

          return { status: 'UnLike', _id: deleted._id.toString(), likes_count: updatedTweet?.likes_count || 0 }
        } else {
          // Like didn’t exist → add new like (Like)
          const inserted = await LikeCollection.insertOne(dataHandle, { session })

          // Update likes_count in Tweet collection
          const updatedTweet = await TweetCollection.findOneAndUpdate(
            { _id: convertObjectId(tweet_id) },
            { $inc: { likes_count: 1 } },
            {
              returnDocument: 'after',
              projection: {
                user_id,
                likes_count: 1
              },
              session
            }
          )

          // Send notification to tweet owner
          if (user_id !== updatedTweet?.user_id.toString()) {
            await notificationQueue.add(CONSTANT_JOB.SEND_NOTI_LIKE, {
              sender_id: user_id,
              tweet_id: tweet_id
            } as CreateNotiLikeDto)
          }

          // Return response
          return { status: 'Like', _id: inserted.insertedId.toString(), likes_count: updatedTweet?.likes_count || 0 }
        }
      })
    } catch (error) {
      if ((error as any)?.code === 11000) {
        // another request already liked
        return {
          _id: '',
          status: 'Like',
          likes_count: 0
        }
      }
      throw new BadRequestError((error as any)?.message || 'Toggling like failed')
    } finally {
      await session.endSession()
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new LikesService()
