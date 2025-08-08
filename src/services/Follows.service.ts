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

  async getUserFollowed(user_id: string) {
    // Lấy user đang follow
    const resultFollower = await FollowerCollection.find(
      {
        user_id: new ObjectId(user_id)
      },
      {
        projection: {
          _id: 0,
          followed_user_id: 1
        }
      }
    ).toArray()

    //
    const followed_user_ids = resultFollower.map((x) => x.followed_user_id) as unknown as string[]
    followed_user_ids.push(user_id)
    return followed_user_ids
  }
}

export default new FollowsService()
