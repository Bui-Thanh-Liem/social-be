import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/infra/queues'
import { CONSTANT_JOB } from '~/shared/constants'
import { ResToggleFollow } from '~/shared/dtos/res/follow.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { FollowersCollection } from './follows.schema'
import { UsersCollection } from '../users/user.schema'

class FollowsService {
  async toggleFollow(user_id: string, followed_user_id: string): Promise<ResToggleFollow> {
    const user_object_id = new ObjectId(user_id)
    const followed_user_object_id = new ObjectId(followed_user_id)

    const data_handle = {
      user_id: user_object_id,
      followed_user_id: followed_user_object_id
    }

    //
    const deleted = await FollowersCollection.findOneAndDelete(data_handle)

    //
    if (deleted?._id) {
      return { status: 'Unfollow', _id: deleted._id.toString() }
    } else {
      //
      const inserted = await FollowersCollection.insertOne({
        user_id: user_object_id,
        followed_user_id: followed_user_object_id
      })

      // Gửi thông báo
      const sender = await UsersCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
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
    const result_following = await FollowersCollection.find(
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
    const followed_user_ids = result_following.map((x) => x.followed_user_id) as unknown as string[]
    followed_user_ids.push(user_id)
    return followed_user_ids
  }

  // Lấy user đang follow mình
  async getUserFollowers(user_id: string) {
    const result_follower = await FollowersCollection.find(
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
    const followers_user_ids = result_follower.map((x) => x.user_id) as unknown as string[]
    return followers_user_ids
  }
}

export default new FollowsService()
