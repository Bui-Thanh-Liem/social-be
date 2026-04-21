import { ObjectId } from 'mongodb'
import { ResToggleFollow } from '~/shared/dtos/public/follows.dto'
import { ENotificationType } from '~/shared/enums/public/notifications.enum'
import { notificationQueue } from '~/infra/queues'
import { FollowersCollection } from '~/schemas/public/follow.schema'
import { UsersCollection } from '~/schemas/public/user.schema'
import { CONSTANT_JOB } from '~/shared/constants/queue.constant'
import usersService from './users.service'

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
      await usersService.incFollowCount(user_id, followed_user_id, -1)
      return { status: 'Unfollow', _id: deleted._id.toString() }
    } else {
      // 1. Thực hiện các lệnh ghi chính
      const [inserted] = await Promise.all([
        FollowersCollection.insertOne(data_handle),
        usersService.incFollowCount(user_id, followed_user_id, 1)
      ])

      // 2. Xử lý thông báo (Có thể chạy ngầm hoặc gộp)
      // Thay vì query name ở đây, có thể truyền user_id vào Worker của Queue
      // và để Worker tự query name để giảm thời gian phản hồi API (Response Time).
      const sender = await UsersCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })
      notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
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
  async getUserFollowingIds(user_id: string) {
    if (!user_id) return []

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
  async getUserFollowerIds(user_id: string, limit?: number, skip?: number) {
    if (!user_id) return []

    const query = FollowersCollection.find(
      {
        followed_user_id: new ObjectId(user_id)
      },
      {
        projection: {
          _id: 0,
          user_id: 1
        }
      }
    )

    // apply skip trước
    if (skip && skip > 0) {
      query.skip(skip)
    }

    // nếu có limit thì apply
    if (limit && limit > 0) {
      query.limit(limit)
    }

    const result_follower = await query.toArray()

    return result_follower.map((x) => x.user_id)
  }
}

export default new FollowsService()
