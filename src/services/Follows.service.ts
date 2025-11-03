import { ObjectId } from 'mongodb'
import { FollowerCollection } from '~/models/schemas/Follower.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { ResToggleFollow } from '~/shared/dtos/res/follow.dto'
import NotificationService from './Notification.service'
import { ENotificationType } from '~/shared/enums/type.enum'

class FollowsService {
  async toggleFollow(user_id: string, followed_user_id: string): Promise<ResToggleFollow> {
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
      return { status: 'Unfollow', _id: deleted._id.toString() }
    } else {
      //
      const inserted = await FollowerCollection.insertOne({
        user_id: userIdObjectId,
        followed_user_id: followedUserIdObjectId
      })

      // Gửi thông báo
      const sender = await UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })
      await NotificationService.createInQueue({
        content: `${sender?.name} đang theo dõi bạn.`,
        type: ENotificationType.Follow,
        sender: user_id,
        receiver: followed_user_id,
        ref_id: user_id
      })

      return { status: 'Follow', _id: inserted.insertedId.toString() }
    }
  }

  // Lấy user mình đang follow
  async getUserFollowing(user_id: string) {
    const resultFollowing = await FollowerCollection.find(
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
    const followed_user_ids = resultFollowing.map((x) => x.followed_user_id) as unknown as string[]
    followed_user_ids.push(user_id)
    return followed_user_ids
  }

  // Lấy user đang follow mình
  async getUserFollowers(user_id: string) {
    const resultFollower = await FollowerCollection.find(
      {
        followed_user_id: new ObjectId(user_id)
      },
      {
        projection: {
          _id: 0,
          user_id: 1
        }
      }
    ).toArray()

    //
    const followers_user_ids = resultFollower.map((x) => x.user_id) as unknown as string[]
    return followers_user_ids
  }
}

export default new FollowsService()
