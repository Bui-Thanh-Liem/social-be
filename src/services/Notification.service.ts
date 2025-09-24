import { ObjectId } from 'mongodb'
import { NotificationCollection, NotificationSchema } from '~/models/schemas/Notification.schema'
import { CreateNotiDto } from '~/shared/dtos/req/notification.dto'
import NotificationGateway from '~/socket/gateways/notification.gateway'

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
    const newNoti = await NotificationCollection.findOne({ _id: result.insertedId })

    //
    if (receiverId && newNoti) {
      NotificationGateway.sendNotification(newNoti, receiverId)
    }

    return true
  }
}

export default new NotificationService()
