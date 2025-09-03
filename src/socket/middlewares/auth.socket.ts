import { ExtendedError, Socket } from 'socket.io'

// Middleware auth cho socket (VD: check token)
export function authMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
  // console.log('authMiddleware - socket.handshake:::', socket.handshake)
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']

  // Thay vì cho ngắt kết nối thì tạo một authError rồi rồi cho kết nối bình thường
  // Sau đó trong connection kiểm tra, nếu có authError thì emit về event 'error'
  if (!token) {
    socket.authError = 'Authentication error' // Lưu lỗi vào socket
    return next() // Vẫn cho phép kết nối
  }

  try {
    // TODO: verify token (jwt.verify, ...)
    // socket.user = { id: '123', name: 'Demo User' } // mock user
    next()
  } catch (err) {
    socket.authError = 'Invalid token'
    next()
  }
}
