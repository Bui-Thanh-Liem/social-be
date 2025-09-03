import { Server, Socket } from 'socket.io'

// Xử lý sự kiện khi user kết nối / ngắt kết nối
export function connectionHandler(io: Server, socket: Socket) {
  //
  if (socket.authError) {
    socket.emit('error', { message: 'liem' })
    socket.emit('message:new', { message: 'liem' })
    // socket.disconnect() // Ngắt kết nối nếu cần
  } else {
    console.log('Kết nối thành công:', socket.id)
  }

  //
  console.log(`🔌 User connected - socket.id::: ${socket.id}`)

  //
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.id} (reason: ${reason})`)
  })

  //
  socket.on('connect_error', (err) => {
    console.error('Lỗi kết nối:', err.message)
    socket.emit('error', { message: 'Không thể kết nối tới server' })
  })
}
