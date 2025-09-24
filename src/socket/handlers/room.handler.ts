import { Server, Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

// Xử lý join/leave room
export async function roomHandler(io: Server, socket: Socket) {
  //
  const { user_id } = socket.decoded_authorization as IJwtPayload // đã qua middleware rồi thì chắc chắn có

  // Join vào room riêng của user để nhận thông báo cá nhân
  await socket.join(user_id as string)

  // Join vào conversation mới
  socket.on(CONSTANT_EVENT_NAMES.JOIN_CONVERSATION, (ids: string[]) => {
    console.log('Join room:::', ids)
    socket.join(ids)
  })

  // Join vào conversation mới
  socket.on(CONSTANT_EVENT_NAMES.LEAVE_CONVERSATION, (ids: string[]) => {
    console.log('Leave room:::', ids)
    ids.forEach((id) => socket.leave(id))
  })
}
