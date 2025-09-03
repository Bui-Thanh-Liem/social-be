import { Server } from 'socket.io'
import { connectionHandler } from './handlers/connection.handler'
import { authMiddleware } from './middlewares/auth.socket'

export function initializeSocket(io: Server) {
  // Apply global middleware
  io.use(authMiddleware)

  io.on('connection', (socket) => {
    connectionHandler(io, socket)
  })
}
