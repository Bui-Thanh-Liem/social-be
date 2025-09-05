import { Server, Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { withValidationDataFromClient } from '../middlewares/validation.socket'
import { messageDtoSchema } from '~/shared/dtos/req/socket/message.dto'

// Xử lý send/new message
export async function messageHandler(io: Server, socket: Socket) {
  //
  socket.on(
    CONSTANT_EVENT_NAMES.SEND_MESSAGE,
    withValidationDataFromClient(messageDtoSchema, (data, socket) => {
      console.log('📩 Message received:', data)

      // broadcast tin nhắn cho room / người nhận
      io.to(data.roomId).emit(CONSTANT_EVENT_NAMES.NEW_MESSAGE, {
        senderId: socket.id,
        text: data.text,
        createdAt: new Date()
      })
    })
  )
}
