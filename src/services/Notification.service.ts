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

    // let lookup = {}

    // Nếu type là mentions thì refId là tweet
    // if (type === ENotificationType.MENTION) {
    //   lookup = {
    //     from: 'tweets',
    //     localField: 'refId',
    //     foreignField: '_id',
    //     as: 'refId',
    //     pipeline: [
    //       {
    //         $project: {
    //           content: 1
    //         }
    //       }
    //     ]
    //   }
    // }

    //
    const notis = await NotificationCollection.aggregate<NotificationSchema>([
      {
        $match: {
          type: type,
          receiver: new ObjectId(user_id)
        }
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
      {
        $unwind: { path: '$sender', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true }
      }
    ]).toArray()

    //
    const total = await NotificationCollection.countDocuments({ type })

    //
    return {
      total,
      total_page: Math.ceil(total / limit),
      items: notis
    }
  }

  async readNoti(id: string) {
    await NotificationCollection.updateOne({ _id: new ObjectId(id) }, { $set: { isRead: true } })
  }

  async countUnreadNoti() {
    return await NotificationCollection.countDocuments({ isRead: false })
  }
}

export default new NotificationService()
