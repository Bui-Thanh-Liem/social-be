import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import cacheServiceInstance from '~/helpers/cache.helper'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { createKeyTweetDetails } from '~/utils/create-key-cache.util'

class LikesService {
  async toggleLike(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleLike> {
    // cập nhật cache
    const key_cache = createKeyTweetDetails(payload.tweet_id)
    const tweet_cached = await cacheServiceInstance.getCache<any>(key_cache)

    //
    const user_Obj_id = new ObjectId(user_id)
    const tweet_obj_id = new ObjectId(payload.tweet_id)

    //
    const dataHandle = {
      user_id: user_Obj_id,
      tweet_id: tweet_obj_id
    }

    // Check and delete if like exists
    const deleted = await LikeCollection.findOneAndDelete(dataHandle)

    let status: 'Like' | 'UnLike'
    let id: string

    if (deleted?._id) {
      // Like existed → deleted successfully (UnLike)
      status = 'UnLike'
      id = deleted._id.toString()

      // cache
      if (tweet_cached && tweet_cached.likes_count !== undefined) {
        tweet_cached.likes_count = (tweet_cached?.likes_count || 1) - 1
        tweet_cached.is_like = false
      }
    } else {
      // Like didn’t exist → add new like (Like)
      const inserted = await LikeCollection.insertOne(dataHandle)
      status = 'Like'
      id = inserted.insertedId.toString()

      //
      const sender = await UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })
      const tw = await TweetCollection.findOne({ _id: new ObjectId(payload.tweet_id) }, { projection: { user_id: 1 } })
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: `${sender?.name} đã thích bài viết của bạn.`,
        type: ENotificationType.Mention_like,
        sender: user_id,
        receiver: tw!.user_id.toString(),
        ref_id: tw?._id.toString()
      })

      // cache
      if (tweet_cached && tweet_cached.likes_count !== undefined) {
        tweet_cached.likes_count = (tweet_cached?.likes_count || 1) + 1
        tweet_cached.is_like = true
      }
    }

    // Calculate likes_count
    const likesCount = await LikeCollection.countDocuments({ tweet_id: tweet_obj_id })

    // Update cache
    if (tweet_cached) {
      await cacheServiceInstance.setCache(key_cache, tweet_cached, { ttl: 300 })
    }

    //
    return { status, _id: id, likes_count: likesCount }
  }

  async deleteByTweetId(tweet_id: string) {
    await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
    return true
  }
}

export default new LikesService()
