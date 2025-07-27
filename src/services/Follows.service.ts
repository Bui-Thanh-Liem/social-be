import { ObjectId } from 'mongodb'
import { FollowerCollection } from '~/models/schemas/Follower.schema'

class FollowsService {
  async toggleFollow(user_id: string, followed_user_id: string) {
    const userIdObjectId = new ObjectId(user_id)
    const followedUserIdObjectId = new ObjectId(followed_user_id)

    const dataHandle = {
      user_id: userIdObjectId,
      followed_user_id: followedUserIdObjectId
    }

    //
    const deleted = await FollowerCollection.findOneAndDelete(dataHandle)

    //
    if (deleted?._id) {
      return { status: 'Unfollow', _id: deleted._id }
    } else {
      //
      const inserted = await FollowerCollection.insertOne({
        user_id: userIdObjectId,
        followed_user_id: followedUserIdObjectId
      })
      return { status: 'Follow', _id: inserted.insertedId }
    }
  }
}

export default new FollowsService()
