import { Server } from 'socket.io'
import cacheService from '~/helpers/cache.helper'
import ConversationsService from '~/services/Conversations.service'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'

//
export async function statusHandler(io: Server, user_id: string, handle: 'onl' | 'off') {
  // 1. Cập nhật Cache Redis (Nhanh, không tốn tài nguyên)
  if (handle === 'onl') {
    await cacheService.markUserOnline(user_id)
  } else {
    await cacheService.markUserOffline(user_id)
  }

  // 2. Lấy tất cả conversationId mà user này tham gia
  const convIds = await ConversationsService.getIdsByUserId(user_id)

  // 3. Chỉ gửi đúng thông tin: "Thằng A vừa Online"
  const eventData = {
    _id: user_id,
    hasOnline: handle === 'onl'
  }

  convIds.forEach((convId) => {
    // Gửi cho tất cả mọi người trong phòng đó
    io.to(convId).emit(CONSTANT_EVENT_NAMES.USER_ONLINE, eventData)
  })
}
