import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { getIO } from '..'

class NotificationGateway {
  sendNotification(noti: INotification, receiverId: string) {
    const io = getIO()
    console.log('sendNotification:::', noti)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_NOTIFICATION, noti)
  }

  sendNewConversation(conversation: IConversation, receiverId: string) {
    const io = getIO()
    console.log('sendNewConversation:::', conversation)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_CONVERSATION, conversation)
  }
}

export default new NotificationGateway()
