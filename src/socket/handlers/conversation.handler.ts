import { Server, Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import NotificationGateway from '../gateways/Notification.gateway'
import ConversationGateway from '../gateways/Conversation.gateway'

// Xử lý join/leave conversation
export async function conversationHandler(io: Server, socket: Socket) {
  //
  const { user_id } = socket.decoded_authorization as IJwtPayload // đã qua middleware rồi thì chắc chắn có

  // Join vào conversation riêng của user để nhận thông báo cá nhân
  await socket.join(user_id as string)
  await NotificationGateway.sendCountUnreadNoti(user_id) // Gửi số lượng thông báo chưa đọc
  await ConversationGateway.sendCountUnreadConv(user_id)

  // Join vào conversation mới
  socket.on(CONSTANT_EVENT_NAMES.JOIN_CONVERSATION, (ids: string[]) => {
    console.log('Join conversation:::', ids)
    socket.join(ids)
  })

  // Leave vào conversation
  socket.on(CONSTANT_EVENT_NAMES.LEAVE_CONVERSATION, (ids: string[]) => {
    console.log('Leave conversation:::', ids)
    ids.forEach((id) => socket.leave(id))
  })
}
