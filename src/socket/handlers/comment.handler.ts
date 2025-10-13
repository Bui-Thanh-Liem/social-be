import { Server, Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'

export async function commentHandler(io: Server, socket: Socket) {
  // Join vào comment
  socket.on(CONSTANT_EVENT_NAMES.JOIN_COMMENT, (id: string) => {
    console.log('Join comment:::', id)
    socket.join(id)
  })

  // Leave ra comment
  socket.on(CONSTANT_EVENT_NAMES.LEAVE_COMMENT, (id: string) => {
    console.log('Leave comment:::', id)
    socket.leave(id)
  })
}
