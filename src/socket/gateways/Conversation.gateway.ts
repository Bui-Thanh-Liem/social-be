import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { getIO } from '..'

class ConversationGateway {
  sendNewConversation(conversation: IConversation, receiverId: string) {
    const io = getIO()
    console.log('ConversationGateway - sendNewConversation:::', conversation)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_CONVERSATION, conversation)
  }

  changeConversation(conversation: IConversation, receiverId: string) {
    const io = getIO()
    console.log('ConversationGateway - changeConversation:::', conversation)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.CHANGE_CONVERSATION, conversation)
  }
}

export default new ConversationGateway()
