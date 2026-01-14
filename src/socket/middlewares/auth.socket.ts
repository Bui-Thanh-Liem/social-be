import { ExtendedError, Socket } from 'socket.io'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'
import { verifyToken } from '~/utils/jwt.util'

// Middleware auth cho socket (VD: check token)
export async function authMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
  // Lấy token
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']

  // Nếu không có token thì báo lỗi
  if (!token) {
    return next(new UnauthorizedError('Không tìm thấy token'))
  }

  try {
    // Xác thực token
    const decoded = await verifyToken({ token, privateKey: envs.JWT_SECRET_ACCESS })
    socket.decoded_authorization = decoded
    next()
  } catch (err) {
    console.log('Socket - authMiddleware - err:::', err)
    next(new UnauthorizedError((err as { message: string })?.message))
  }
}
