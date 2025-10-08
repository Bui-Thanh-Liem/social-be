import { ObjectId } from 'mongodb'
import { NotificationCollection, NotificationSchema } from '~/models/schemas/Notification.schema'
import { CreateNotiDto } from '~/shared/dtos/req/notification.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { ResMultiType } from '~/shared/types/response.type'
import NotificationGateway from '~/socket/gateways/Notification.gateway'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'

class NotificationService {
  async create(payload: CreateNotiDto) {
    const { content, type, sender: senderId, receiver: receiverId, refId } = payload

    //
    const result = await NotificationCollection.insertOne(
      new NotificationSchema({
        content,
        type,
        sender: new ObjectId(senderId),
        receiver: new ObjectId(receiverId),
        refId: refId ? new ObjectId(refId) : undefined
      })
    )

    //
    const newNoti = await NotificationCollection.aggregate<NotificationSchema>([
      { $match: { _id: result.insertedId } },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      // chỉ thêm khi có lookup (tạm thời cho type All là tweet)
      ...(type === ENotificationType.MENTION_LIKE || type === ENotificationType.ALL
        ? [
            {
              $lookup: {
                from: 'tweets',
                localField: 'refId',
                foreignField: '_id',
                as: 'tweetRef',
                pipeline: [{ $project: { type: 1, parent_id: 1 } }]
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'refId',
                foreignField: '_id',
                as: 'userRef',
                pipeline: [
                  {
                    $project: {
                      username: 1
                    }
                  }
                ]
              }
            }
          ]
        : []),
      { $unwind: { path: '$refId', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tweetRef', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$userRef', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } }
    ]).next()

    //
    if (receiverId && newNoti) {
      NotificationGateway.sendNotification(newNoti, receiverId)
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

    const match: {
      type?: ENotificationType
      receiver: ObjectId
    } = { type, receiver: new ObjectId(user_id) }

    // Nếu type là ALL
    if (type === ENotificationType.ALL) {
      if (match.type) delete match.type
    }

    //
    const notis = await NotificationCollection.aggregate<NotificationSchema>([
      {
        $match: match
      },
      {
        $sort: sort
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      // Lookup for sender
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      // Lookup for receiver
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      // chỉ thêm khi có lookup (tạm thời cho type All là tweet)
      ...(type === ENotificationType.MENTION_LIKE || type === ENotificationType.ALL
        ? [
            {
              $lookup: {
                from: 'tweets',
                localField: 'refId',
                foreignField: '_id',
                as: 'tweetRef',
                pipeline: [{ $project: { type: 1, parent_id: 1 } }]
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'refId',
                foreignField: '_id',
                as: 'userRef',
                pipeline: [
                  {
                    $project: {
                      username: 1
                    }
                  }
                ]
              }
            }
          ]
        : []),
      { $unwind: { path: '$refId', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tweetRef', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$userRef', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } }
    ]).toArray()

    //
    const total = await NotificationCollection.countDocuments({
      ...(type === ENotificationType.ALL ? {} : { type }),
      receiver: new ObjectId(user_id)
    })

    //
    return {
      total,
      total_page: Math.ceil(total / limit),
      items: notis
    }
  }

  async read(noti_id: string, user_id: string) {
    await NotificationCollection.updateOne({ _id: new ObjectId(noti_id) }, { $set: { isRead: true } })
    await NotificationGateway.sendCountUnreadNoti(user_id)
    return true
  }

  async countUnreadNoti(user_id: string) {
    return await NotificationCollection.countDocuments({ isRead: false, receiver: new ObjectId(user_id) })
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
