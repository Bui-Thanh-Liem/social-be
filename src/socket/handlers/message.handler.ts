import { Server, Socket } from 'socket.io'

export function messageHandler(io: Server, socket: Socket) {
  socket.on('message:send', (data) => {
    console.log('📩 Message received:', data)

    // broadcast tin nhắn cho room / người nhận
    io.to(data.roomId).emit('message:new', { senderId: socket.id, text: data.text, createdAt: new Date() })
  })
}
