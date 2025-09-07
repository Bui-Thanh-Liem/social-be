import { ExtendedError, Socket } from 'socket.io'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/shared/classes/error.class'
import { verifyToken } from '~/utils/jwt.util'

// Middleware auth cho socket (VD: check token)
export async function authMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
  // Get token
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']

  // Check exist token
  if (!token) {
    return next(new UnauthorizedError('Missing token'))
  }

  try {
    // Verify token
    const decoded = await verifyToken({ token, privateKey: envs.JWT_SECRET_ACCESS })
    socket.decoded_authorization = decoded
    next()
  } catch (err) {
    console.log('Socket - authMiddleware - err:::', err)
    next(new UnauthorizedError((err as { message: string })?.message))
  }
}
