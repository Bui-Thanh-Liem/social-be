import { Server, Socket } from 'socket.io'

// Xử lý sự kiện khi user kết nối / ngắt kết nối
export async function connectionHandler(io: Server, socket: Socket) {
  // Đã qua middleware rồi thì chắc chắn có
  const decoded = socket.decoded_authorization

  console.log(`🔌 User connected - socket.id::: ${socket.id}`)
  console.log(`🔌 User connected - decoded::: ${decoded}`)

  //
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.id} (reason: ${reason})`)
  })
}
