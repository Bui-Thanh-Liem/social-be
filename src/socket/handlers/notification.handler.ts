import { Server, Socket } from 'socket.io'
import NotificationService from '~/services/Notification.service'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import NotificationGateway from '../gateways/Notification.gateway'

// Xử lý sự kiện khi client đọc thông báo
export async function notificationHandler(io: Server, socket: Socket) {
  // Join vào conversation mới
  socket.on(CONSTANT_EVENT_NAMES.READ_NOTIFICATION, async (id: string) => {
    console.log('READ_NOTIFICATION - id:::', id)
    await NotificationService.readNoti(id)

    //
    const decoded = socket.decoded_authorization!
    await NotificationGateway.sendCountUnreadNoti(decoded.user_id)
  })
}
