import { ObjectId } from 'mongodb'
import { ToggleLikeDto } from '~/dtos/requests/like.dto'
import { LikeCollection } from '~/models/schemas/Like.schema'

class LikesService {
  async toggleLike(user_id: string, payload: ToggleLikeDto) {
    const userObjectId = new ObjectId(user_id)
    const tweetObjectId = new ObjectId(payload.tweet_id)

    const dataHandle = {
      user_id: userObjectId,
      tweet_id: tweetObjectId
    }

    const deleted = await LikeCollection.findOneAndDelete(dataHandle)

    if (deleted?._id) {
      // Nếu đã tồn tại → đã xóa thành công
      return { status: 'UnLike', _id: deleted._id }
    } else {
      const inserted = await LikeCollection.insertOne(dataHandle)
      return { status: 'Like', _id: inserted.insertedId }
    }
  }
}

export default new LikesService()
