import { ObjectId } from 'mongodb'
import { MessageCollection, MessageSchema } from '~/models/schemas/Message.schema'
import { CreateMessageDto } from '~/shared/dtos/req/message.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IMessage } from '~/shared/interfaces/schemas/message.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
class MessagesService {
  async create(user_id: string, payload: CreateMessageDto) {
    return await MessageCollection.insertOne(
      new MessageSchema({
        sender: new ObjectId(user_id),
        conversation: new ObjectId(payload.conversation),
        content: payload.content,
        attachments: payload.attachments
      })
    )
  }

  async getManyByConversation({
    query,
    conversation_id
  }: {
    conversation_id: string
    query: IQuery<IMessage>
  }): Promise<ResMultiType<IMessage>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IMessage>(query)

    //
    const messages = await MessageCollection.aggregate<MessageSchema>([
      {
        $match: { conversation: new ObjectId(conversation_id) }
      },
      {
        $sort: sort
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
