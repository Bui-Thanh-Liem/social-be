import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { NotificationCollection, NotificationSchema } from '~/models/schemas/Notification.schema'
import { publishNotification } from '~/pubsub/publisher'
import { CONSTANT_JOB } from '~/shared/constants'
import { CreateNotiDto } from '~/shared/dtos/req/notification.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { ResMultiType } from '~/shared/types/response.type'
import NotificationGateway from '~/socket/gateways/Notification.gateway'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'

class NotificationService {
  async create(payload: CreateNotiDto) {
    const { content, type, sender: senderId, receiver: receiver_id, ref_id } = payload

    //
    const result = await NotificationCollection.insertOne(
      new NotificationSchema({
        content,
        type,
        sender: new ObjectId(senderId),
        receiver: new ObjectId(receiver_id),
        ref_id: ref_id ? new ObjectId(ref_id) : undefined
      })
    )

    //
    const pipeline: any[] = [
      { $match: { _id: result.insertedId } },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      }
    ]

    if (type === ENotificationType.Mention_like) {
      pipeline.push({
        $lookup: {
          from: 'tweets',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'tweet_ref',
          pipeline: [{ $project: { type: 1, parent_id: 1 } }]
        }
      })
    }

    if (type === ENotificationType.Follow) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'user_ref',
          pipeline: [{ $project: { username: 1 } }]
        }
      })
    }

    if (type === ENotificationType.Community) {
      pipeline.push({
        $lookup: {
          from: 'community',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'community_ref',
          pipeline: [{ $project: { slug: 1 } }]
        }
      })
    }

    pipeline.push(
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tweet_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$community_ref', preserveNullAndEmptyArrays: true } }
    )

    const new_noti = await NotificationCollection.aggregate<NotificationSchema>(pipeline).next()

    //
    if (receiver_id && new_noti) {
      await publishNotification({ new_noti, receiver_id })
    }

    return true
  }

  async createInQueue(payload: CreateNotiDto) {
    notificationQueue.add(CONSTANT_JOB.SEND_NOTI, payload)
  }

  async getMultiByType({
    user_id,
    query,
    type
  }: {
    user_id: string
    type: ENotificationType
    query: IQuery<INotification>
  }): Promise<ResMultiType<INotification>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<INotification>(query)

    const match = { type, receiver: new ObjectId(user_id) }

    const pipeline: any[] = [
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      }
    ]

    if (type === ENotificationType.Mention_like) {
      pipeline.push({
        $lookup: {
          from: 'tweets',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'tweet_ref',
          pipeline: [{ $project: { type: 1, parent_id: 1 } }]
        }
      })
    }

    if (type === ENotificationType.Follow) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'user_ref',
          pipeline: [{ $project: { username: 1 } }]
        }
      })
    }

    if (type === ENotificationType.Community) {
      pipeline.push({
        $lookup: {
          from: 'communities',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'community_ref',
          pipeline: [{ $project: { slug: 1 } }]
        }
      })
    }

    pipeline.push(
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tweet_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$community_ref', preserveNullAndEmptyArrays: true } }
    )

    const notis = await NotificationCollection.aggregate<NotificationSchema>(pipeline).toArray()

    const total = await NotificationCollection.countDocuments(match)

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: notis
    }
  }

  async read(noti_id: string, user_id: string) {
    await NotificationCollection.updateOne({ _id: new ObjectId(noti_id) }, { $set: { isRead: true } })
    await NotificationGateway.sendCountUnreadNoti(user_id)
    await NotificationGateway.sendCountUnreadNotiByType(user_id)
    return true
  }

  async countUnreadNoti(user_id: string) {
    return await NotificationCollection.countDocuments({ isRead: false, receiver: new ObjectId(user_id) })
  }

  async countUnreadNotiByType(user_id: string) {
    const result = await NotificationCollection.aggregate([
      {
        $match: {
          isRead: false,
          receiver: new ObjectId(user_id)
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    // Chuyển về dạng dễ dùng
    const counts = result.reduce(
      (acc, cur) => {
        acc[cur._id] = cur.count
        return acc
      },
      {} as Record<string, number>
    )

    return counts
  }

  async delete(noti_id: string, user_id: string) {
    await NotificationCollection.deleteOne({ _id: new ObjectId(noti_id) })
    await NotificationGateway.sendCountUnreadNoti(user_id)
    return true
  }

  async cleanupOldNotifications() {
    const fifteenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

    // Lấy danh sách tất cả người nhận có thông báo cũ
    const users = await NotificationCollection.aggregate([
      { $match: { created_at: { $lt: fifteenDaysAgo } } },
      { $group: { _id: '$receiver' } }
    ]).toArray()

    for (const u of users) {
      const receiverId = u._id as ObjectId

      // Lấy 200 notification mới nhất của user đó
      const latest = await NotificationCollection.find({ receiver: receiverId })
        .sort({ created_at: -1 })
        .limit(200)
        .project({ _id: 1 })
        .toArray()

      const keepIds = latest.map((n) => n._id)

      // Xoá các thông báo cũ hơn 15 ngày và không nằm trong top 200
      await NotificationCollection.deleteMany({
        receiver: receiverId,
        created_at: { $lt: fifteenDaysAgo },
        _id: { $nin: keepIds }
      })
    }
  }
}

export default new NotificationService()
