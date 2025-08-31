import { ObjectId } from 'mongodb'
import { ConversationCollection, ConversationSchema } from '~/models/schemas/Conversation.schema'
import { CreateConversationDto } from '~/shared/dtos/req/conversation.dto'
import { EConversationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'

class ConversationsService {
  async create({ user_id, payload }: { user_id: string; payload: CreateConversationDto }) {
    const userObjectId = new ObjectId(user_id)

    if (payload.type === EConversationType.Private) {
      const participantObjectId = new ObjectId(payload.participants[0]) // Nếu type là private thì participant luôn là một User

      return await ConversationCollection.findOneAndUpdate(
        {
          type: payload.type,
          participants: [userObjectId, participantObjectId]
        },
        {
          $setOnInsert: new ConversationSchema({
            type: payload.type,
            participants: [userObjectId, participantObjectId]
          })
        },
        { upsert: true, returnDocument: 'after' }
      )
    }

    const participantObjectIds = payload.participants.map((userId) => new ObjectId(userId))
    return await ConversationCollection.insertOne(
      new ConversationSchema({
        type: payload.type,
        name: payload.name,
        participants: [userObjectId, ...participantObjectIds]
      })
    )
  }

  async getMulti({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<IConversation>
  }): Promise<ResMultiType<IConversation>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IConversation>(query)

    //
    const conversations = await ConversationCollection.aggregate<ConversationSchema>([
      {
        $match: {
          participants: {
            $in: [new ObjectId(user_id)]
          }
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_',
          as: 'lastMessage',
          pipeline: [
            {
              $project: {
                content: 1,
                created_at: 1
              }
            }
          ]
        }
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
    const total = await ConversationCollection.countDocuments({
      participants: {
        $in: [new ObjectId(user_id)]
      }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: conversations
    }
  }

  async updateLastMessage(conversation_id: string, message_id: string) {
    return await ConversationCollection.findOneAndUpdate(
      { _id: new ObjectId(conversation_id) },
      {
        $set: {
          lastMessage: new ObjectId(message_id),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' } // để trả về doc mới
    )
  }
}

export default new ConversationsService()
