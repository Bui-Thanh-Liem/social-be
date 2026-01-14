import { Server, Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import ConversationGateway from '../gateways/Conversation.gateway'
import NotificationGateway from '../gateways/Notification.gateway'
import cacheService from '~/helpers/cache.helper'

// Xử lý join/leave conversation
export async function conversationHandler(io: Server, socket: Socket) {
  //
  const { user_id } = socket.decoded_authorization as IJwtPayload // đã qua middleware rồi thì chắc chắn có

  // Join vào conversation riêng của user để nhận thông báo cá nhân
  await socket.join(user_id as string)
  await NotificationGateway.sendCountUnreadNoti(user_id) // Gửi số lượng thông báo chưa đọc
  await NotificationGateway.sendCountUnreadNotiByType(user_id) // Gửi số lượng thông báo chưa đọc theo type
  await ConversationGateway.sendCountUnreadConv(user_id) // Gửi số lượng cuộc trò chuyện chưa đọc

  // Join vào conversation mới
  socket.on(CONSTANT_EVENT_NAMES.JOIN_CONVERSATION, async (ids: string[]) => {
    console.log('Join conversation:::', ids)

    // 1. Lưu vào Redis
    for (const conversationId of ids) {
      await cacheService.sAdd(`user_rooms:${user_id}`, conversationId)
    }

    // 2. Join socket.io room
    socket.join(ids)
  })

  // Leave ra conversation
  socket.on(CONSTANT_EVENT_NAMES.LEAVE_CONVERSATION, (ids: string[]) => {
    console.log('Leave conversation:::', ids)

    // 1. Xoá khỏi Redis
    ids.forEach(async (conversationId) => {
      await cacheService.sRem(`user_rooms:${user_id}`, conversationId)
    })

    //
    ids.forEach((id) => socket.leave(id))
  })
}
