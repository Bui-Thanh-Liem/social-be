import NotificationService from '~/modules/notifications/notifications.service'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { getIO } from '..'

class NotificationGateway {
  async sendNotification(noti: INotification, receiverId: string) {
    const io = getIO()

    //
    await this.sendCountUnreadNoti(receiverId)
    await this.sendCountUnreadNotiByType(receiverId)

    //
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_NOTIFICATION, noti)
  }

  async sendCountUnreadNoti(receiverId: string) {
    const io = getIO()
    const count = await NotificationService.countUnreadNoti(receiverId)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.UNREAD_COUNT_NOTIFICATION, count)
  }

  // Gửi sô lượng thông báo chưa đọc theo từng loại
  async sendCountUnreadNotiByType(receiverId: string) {
    const io = getIO()
    const count = await NotificationService.countUnreadNotiByType(receiverId)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.UNREAD_COUNT_NOTIFICATION_BY_TYPE, count)
  }
}

export default new NotificationGateway()
