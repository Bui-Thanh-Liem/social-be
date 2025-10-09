import { ObjectId } from 'mongodb'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { ToggleLikeDto } from '~/shared/dtos/req/like.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import NotificationService from './Notification.service'

class LikesService {
  async toggleLike(user_id: string, payload: ToggleLikeDto): Promise<ResToggleLike> {
    const userObjectId = new ObjectId(user_id)
    const tweetObjectId = new ObjectId(payload.tweet_id)

    const dataHandle = {
      user_id: userObjectId,
      tweet_id: tweetObjectId
    }

    // Check and delete if like exists
    const deleted = await LikeCollection.findOneAndDelete(dataHandle)

    let status: 'Like' | 'UnLike'
    let id: string

    if (deleted?._id) {
      // Like existed → deleted successfully (UnLike)
      status = 'UnLike'
      id = deleted._id.toString()
    } else {
      // Like didn’t exist → add new like (Like)
      const inserted = await LikeCollection.insertOne(dataHandle)
      status = 'Like'
      id = inserted.insertedId.toString()

      //
      const sender = await UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })
      const tw = await TweetCollection.findOne({ _id: new ObjectId(payload.tweet_id) }, { projection: { user_id: 1 } })
      await NotificationService.create({
        content: `${sender?.name} đã thích bài viết của bạn.`,
        type: ENotificationType.MENTION_LIKE,
        sender: user_id,
        receiver: tw!.user_id.toString(),
        refId: tw?._id.toString()
      })
    }

    // Calculate likes_count
    const likesCount = await LikeCollection.countDocuments({ tweet_id: tweetObjectId })

    return { status, _id: id, likes_count: likesCount }
  }

  async deleteByTweetId(tweet_id: string) {
    await LikeCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
    return true
  }
}

export default new LikesService()
