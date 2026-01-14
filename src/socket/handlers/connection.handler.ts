import { Server, Socket } from 'socket.io'
import { statusHandler } from './status.handler'

// Xử lý sự kiện khi user kết nối / ngắt kết nối
export async function connectionHandler(io: Server, socket: Socket) {
  // Đã qua middleware rồi thì chắc chắn có
  const decoded = socket.decoded_authorization

  //
  console.log(`🔌 User connected - decoded - user_id::: ${decoded?.user_id}`)
  if (decoded?.user_id) await statusHandler(io, decoded?.user_id, 'onl')

  //
  socket.on('disconnect', async (reason) => {
    console.log(`❌ User disconnected - decoded - user_id::: ${decoded?.user_id}`)
    if (decoded?.user_id) await statusHandler(io, decoded?.user_id, 'off')
  })
}
