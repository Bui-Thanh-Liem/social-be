import { Server, Socket } from 'socket.io'
import MessagesService from '~/modules/messages/messages.service'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { sendMessageDtoSchema } from '~/shared/dtos/req/socket/message.dto'
import { withValidationDataFromClient } from '../middlewares/validation.socket'

// Xử lý send/new message
export async function messageHandler(io: Server, socket: Socket) {
  //
  socket.on(
    CONSTANT_EVENT_NAMES.SEND_MESSAGE,
    withValidationDataFromClient(sendMessageDtoSchema, socket, async (data, socket) => {
      const { content, conversation, sender, attachments } = data
      console.log('Có ai đó gửi tin nhắn :::', content)

      //
      const newMessage = await MessagesService.create(sender, { content, conversation, attachments })

      // broadcast tin nhắn cho room / người nhận
      console.log('messageHandler - broadcast - conversationId:::', data.conversation)
      io.to(data.conversation).emit(CONSTANT_EVENT_NAMES.NEW_MESSAGE, newMessage)
    })
  )
}
