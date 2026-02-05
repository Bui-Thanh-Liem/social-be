import { ObjectId } from 'mongodb'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { publishNotification } from '~/pubsub/publisher'
import { CreateNotiDto } from '~/shared/dtos/req/notification.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import NotificationGateway from '~/socket/gateways/Notification.gateway'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { NotificationsCollection, NotificationsSchema } from './notification.schema'

class NotificationService {
  async create(payload: CreateNotiDto) {
    const { content, type, sender: senderId, receiver: receiver_id, ref_id } = payload

    //
    const result = await NotificationsCollection.insertOne(
      new NotificationsSchema({
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
          from: 'communities',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'community_ref',
          pipeline: [{ $project: { slug: 1 } }]
        }
      })
    }

    if (type === ENotificationType.Other) {
      pipeline.push({
        $lookup: {
          from: 'medias',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'media_ref',
          pipeline: [{ $project: { s3_key: 1 } }]
        }
      })
    }

    pipeline.push(
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tweet_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$community_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$media_ref', preserveNullAndEmptyArrays: true } }
    )

    const new_noti = await NotificationsCollection.aggregate<INotification>(pipeline).next()

    //
    console.log('publishNotification:::', new_noti)

    // SignUrl nếu ref_id là media
    if (new_noti?.media_ref) {
      new_noti.media_ref = {
        ...new_noti.media_ref,
        ...signedCloudfrontUrl(new_noti.media_ref)
      }
    }

    if (receiver_id && new_noti) {
      await publishNotification({ new_noti, receiver_id })
    }

    return true
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

    if (type === ENotificationType.Other) {
      pipeline.push({
        $lookup: {
          from: 'medias',
          localField: 'ref_id',
          foreignField: '_id',
          as: 'media_ref',
          pipeline: [{ $project: { s3_key: 1 } }]
        }
      })
    }

    pipeline.push(
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tweet_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$community_ref', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$media_ref', preserveNullAndEmptyArrays: true } }
    )

    //
    const [notis, total] = await Promise.all([
      NotificationsCollection.aggregate<INotification>(pipeline).toArray(),
      NotificationsCollection.countDocuments(match)
    ])

    //
    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontUserUrls(notis) as INotification[]
    }
  }

  async read(noti_id: string, user_id: string) {
    await NotificationsCollection.updateOne({ _id: new ObjectId(noti_id) }, { $set: { isRead: true } })
    await NotificationGateway.sendCountUnreadNoti(user_id)
    await NotificationGateway.sendCountUnreadNotiByType(user_id)
    return true
  }

  async countUnreadNoti(user_id: string) {
    return await NotificationsCollection.countDocuments({ isRead: false, receiver: new ObjectId(user_id) })
  }

  async countUnreadNotiByType(user_id: string) {
    const result = await NotificationsCollection.aggregate([
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
    await NotificationsCollection.deleteOne({ _id: new ObjectId(noti_id) })
    await NotificationGateway.sendCountUnreadNoti(user_id)
    return true
  }

  async cleanupOldNotifications() {
    const fifteenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

    // Lấy danh sách tất cả người nhận có thông báo cũ
    const users = await NotificationsCollection.aggregate([
      { $match: { created_at: { $lt: fifteenDaysAgo } } },
      { $group: { _id: '$receiver' } }
    ]).toArray()

    for (const u of users) {
      const receiverId = u._id as ObjectId

      // Lấy 200 notification mới nhất của user đó
      const latest = await NotificationsCollection.find({ receiver: receiverId })
        .sort({ created_at: -1 })
        .limit(200)
        .project({ _id: 1 })
        .toArray()

      const keepIds = latest.map((n) => n._id)

      // Xoá các thông báo cũ hơn 15 ngày và không nằm trong top 200
      await NotificationsCollection.deleteMany({
        receiver: receiverId,
        created_at: { $lt: fifteenDaysAgo },
        _id: { $nin: keepIds }
      })
    }
  }

  //
  private signedCloudfrontUserUrls = (noti: INotification[] | INotification | null) => {
    //
    if (!noti) return noti

    //
    if (!Array.isArray(noti))
      return {
        ...noti,
        sender: {
          ...noti.sender,
          avatar: (noti.sender as IUser)?.avatar
            ? {
                ...(noti.sender as IUser).avatar,
                ...signedCloudfrontUrl((noti.sender as IUser).avatar)
              }
            : null
        },
        media_ref: {
          ...noti.media_ref,
          ...signedCloudfrontUrl(noti.media_ref)
        }
      }

    //
    return noti.map((n) => ({
      ...n,
      sender: {
        ...n.sender,
        avatar: (n.sender as IUser)?.avatar
          ? {
              ...(n.sender as IUser).avatar,
              ...signedCloudfrontUrl((n.sender as IUser).avatar)
            }
          : null
      },
      media_ref: {
        ...n.media_ref,
        ...signedCloudfrontUrl(n.media_ref)
      }
    }))
  }
}

export default new NotificationService()
