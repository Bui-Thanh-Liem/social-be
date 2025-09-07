import { ObjectId } from 'mongodb'
import { MessageCollection, MessageSchema } from '~/models/schemas/Message.schema'
import { CreateMessageDto } from '~/shared/dtos/req/message.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IMessage } from '~/shared/interfaces/schemas/message.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import ConversationsService from './Conversations.service'
class MessagesService {
  async create(sender_id: string, payload: CreateMessageDto) {
    //
    const newMessage = await MessageCollection.insertOne(
      new MessageSchema({
        sender: new ObjectId(sender_id),
        conversation: new ObjectId(payload.conversation),
        content: payload.content,
        attachments: payload.attachments
      })
    )

    // Khi có tin nhắn mới thì cập nhật lastMessage trong
    // conversation db và emit về client
    if (newMessage) {
      await ConversationsService.updateLastMessage(payload.conversation, newMessage.insertedId.toString())
    }

    //
    return await MessageCollection.findOne({ _id: newMessage.insertedId })
  }

  async getMultiByConversation({
    query,
    conversation_id
  }: {
    conversation_id: string
    query: IQuery<IMessage>
  }): Promise<ResMultiType<IMessage>> {
    const { skip, limit } = getPaginationAndSafeQuery<IMessage>(query)

    //
    const messages = await MessageCollection.aggregate<MessageSchema>([
      {
        $match: { conversation: new ObjectId(conversation_id) }
      },
      {
        $sort: { created_at: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]).toArray()

    //
    const total = await MessageCollection.countDocuments({ conversation: new ObjectId(conversation_id) })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: messages
    }
  }
}

export default new MessagesService()
