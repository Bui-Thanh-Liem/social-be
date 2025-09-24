import { ObjectId } from 'mongodb'
import { NotificationCollection, NotificationSchema } from '~/models/schemas/Notification.schema'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { CreateNotiDto } from '~/shared/dtos/req/notification.dto'
import { getIO } from '~/socket'

class NotificationService {
  async create(payload: CreateNotiDto) {
    const io = getIO()
    const { content, type, sender: senderId, receiver: receiverId, refId } = payload

    //
    const newNoti = await NotificationCollection.insertOne(
      new NotificationSchema({
        content,
        type,
        sender: new ObjectId(senderId),
        receiver: new ObjectId(receiverId),
        refId: refId ? new ObjectId(refId) : undefined
      })
    )

    //
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_NOTIFICATION, newNoti)

    return true
  }
}

export default new NotificationService()
