import ConversationsService from '~/services/Conversations.service'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { getIO } from '..'

class ConversationGateway {
  async sendNewConversation(conversation: IConversation, receiverId: string) {
    const io = getIO()
    console.log('ConversationGateway - sendNewConversation:::', conversation)

    //
    await this.sendCountUnreadConv(receiverId)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_CONVERSATION, conversation)
  }

  async changeConversation(conversation: IConversation, receiverId: string) {
    const io = getIO()
    console.log('ConversationGateway - changeConversation:::', conversation)

    //
    await this.sendCountUnreadConv(receiverId)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.CHANGE_CONVERSATION, conversation)
  }

  //
  async sendCountUnreadConv(receiverId: string) {
    const io = getIO()
    const count = await ConversationsService.countUnread(receiverId)
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.UNREAD_COUNT_CONVERSATION, count)
  }
}

export default new ConversationGateway()
