import { Server, Socket } from 'socket.io'
import { connectionHandler } from './handlers/connection.handler'
import { conversationHandler } from './handlers/conversation.handler'
import { messageHandler } from './handlers/message.handler'
import { authMiddleware } from './middlewares/auth.socket'

let _io: Server
let _socket: Socket

export function initializeSocket(io: Server) {
  //
  _io = io

  // Apply global middleware
  io.use(authMiddleware)

  io.on('connection', async (socket) => {
    _socket = socket

    // Nhận emit từ client
    await connectionHandler(io, socket)
    await conversationHandler(io, socket)
    await messageHandler(io, socket)
  })
}

export function getIO(): Server {
  return _io
}

export function getSocket(): Socket {
  return _socket
}
