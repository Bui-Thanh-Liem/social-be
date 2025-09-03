import { Server, Socket } from 'socket.io'
import ConversationsService from '~/services/Conversations.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

// Xử lý join/leave room
export async function roomHandler(io: Server, socket: Socket) {
  //
  const { user_id } = socket.decoded_authorization as IJwtPayload // đã qua middleware rồi thì chắc chắn có

  // Join vào room riêng của user để nhận thông báo cá nhân
  await socket.join(user_id as string)

  // Join vào tất cả conversation room
  const conversationIds = await ConversationsService.getAllIds(user_id)
  conversationIds.forEach((id) => socket.join(id))
}
