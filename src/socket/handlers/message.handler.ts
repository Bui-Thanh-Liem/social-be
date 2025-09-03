import { Server, Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'

// Xử lý send/new message
export async function messageHandler(io: Server, socket: Socket) {
  //
  socket.on(CONSTANT_EVENT_NAMES.SEND_MESSAGE, (data) => {
    console.log('📩 Message received:', data)

    // broadcast tin nhắn cho room / người nhận
    io.to(data.roomId).emit(CONSTANT_EVENT_NAMES.NEW_MESSAGE, {
      senderId: socket.id,
      text: data.text,
      createdAt: new Date()
    })
  })
}
