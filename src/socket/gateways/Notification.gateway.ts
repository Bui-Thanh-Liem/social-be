import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { getIO } from '..'
import NotificationService from '~/services/Notification.service'

class NotificationGateway {
  async sendNotification(noti: INotification, receiverId: string) {
    const io = getIO()
    console.log('NotificationGateway - sendNotification:::', noti)

    //
    await this.sendCountUnreadNoti(receiverId)

    //
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_NOTIFICATION, noti)
  }

  async sendCountUnreadNoti(receiverId: string) {
    const io = getIO()
    const count = await NotificationService.countUnreadNoti()
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.UNREAD_COUNT_NOTIFICATION, count)
  }
}

export default new NotificationGateway()
