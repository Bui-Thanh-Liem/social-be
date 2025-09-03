import { Server } from 'socket.io'
import { connectionHandler } from './handlers/connection.handler'
import { messageHandler } from './handlers/message.handler'
import { roomHandler } from './handlers/room.handler'
import { authMiddleware } from './middlewares/auth.socket'

let _io: Server

export function initializeSocket(io: Server) {
  //
  _io = io

  // Apply global middleware
  io.use(authMiddleware)

  io.on('connection', async (socket) => {
    await connectionHandler(io, socket)
    await roomHandler(io, socket)
    await messageHandler(io, socket)
  })
}

export function getIO(): Server {
  return _io
}
