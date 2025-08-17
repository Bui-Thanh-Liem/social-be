import { ObjectId } from 'mongodb'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { ToggleLikeDto } from '~/shared/dtos/req/like.dto'
import { ResToggleLike } from '~/shared/dtos/res/like.dto'

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
    }

    // Calculate likes_count
    const likesCount = await LikeCollection.countDocuments({ tweet_id: tweetObjectId })

    return { status, _id: id, likes_count: likesCount }
  }
}

export default new LikesService()
