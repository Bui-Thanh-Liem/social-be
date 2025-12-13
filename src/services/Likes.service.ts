import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { BadRequestError } from '~/core/error.response'
import { clientMongodb } from '~/dbs/init.mongodb'
import cacheServiceInstance from '~/helpers/cache.helper'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { convertObjectId } from '~/utils/convert-object-id'
import { createKeyTweetDetails } from '~/utils/create-key-cache.util'

class LikesService {
  async toggleLike(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleLike> {
    const { tweet_id } = payload

    // cập nhật cache
    const key_cache = createKeyTweetDetails(tweet_id)
    const tweet_cached = await cacheServiceInstance.getCache<any>(key_cache)

    // ObjectId
    const user_Obj_id = new ObjectId(user_id)
    const tweet_obj_id = new ObjectId(tweet_id)

    // data handle
    const dataHandle = {
      user_id: user_Obj_id,
      tweet_id: tweet_obj_id
    }

    // Check and delete if like exists
    const session = clientMongodb.startSession()
    try {
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

          // cache in tweet details
          if (tweet_cached && tweet_cached.likes_count !== undefined) {
            tweet_cached.likes_count = updatedTweet?.likes_count
            tweet_cached.likes = tweet_cached.likes.filter((like: any) => like.user_id.toString() !== user_id)
          }

          // cache in tweet details
          if (tweet_cached) {
            await cacheServiceInstance.setCache(key_cache, tweet_cached, { ttl: 300 })
          }

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
                likes_count: 1
              },
              session
            }
          )

          // Send notification to tweet owner
          const [sender, tw] = await Promise.all([
            UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } }),
            TweetCollection.findOne({ _id: new ObjectId(tweet_id) }, { projection: { user_id: 1 } })
          ])
          await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
            content: `${sender?.name} đã thích bài viết của bạn.`,
            type: ENotificationType.Mention_like,
            sender: user_id,
            receiver: tw!.user_id.toString(),
            ref_id: tw?._id.toString()
          })

          // cache  in tweet details
          if (tweet_cached && tweet_cached.likes_count !== undefined) {
            tweet_cached.likes_count = updatedTweet?.likes_count
            tweet_cached.likes = tweet_cached.likes.concat([{ _id: inserted.insertedId, user_id: user_Obj_id }])
          }

          // cache in tweet details
          if (tweet_cached) {
            await cacheServiceInstance.setCache(key_cache, tweet_cached, { ttl: 300 })
          }

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
    await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
    return true
  }
}

export default new LikesService()
