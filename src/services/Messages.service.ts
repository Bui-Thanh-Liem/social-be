import { ObjectId } from 'mongodb'
import pLimit from 'p-limit'
import { MessageCollection, MessageSchema } from '~/models/schemas/Message.schema'
import { CreateMessageDto } from '~/shared/dtos/req/message.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IMessage } from '~/shared/interfaces/schemas/message.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import ConversationsService from './Conversations.service'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'
import UploadsServices from './Uploads.service'

class MessagesService {
  async create(sender_id: string, payload: CreateMessageDto) {
    //
    let media: undefined | IMedia[] = undefined
    if (payload.attachments) {
      media = await UploadsServices.getMultiByKeys(payload.attachments)
    }

    //
    const newMessage = await MessageCollection.insertOne(
      new MessageSchema({
        content: payload.content,
        sender: new ObjectId(sender_id),
        attachments: media,
        conversation: new ObjectId(payload.conversation)
      })
    )

    // Khi có tin nhắn mới thì cập nhật lastMessage trong conversation db và emit về client
    if (newMessage) {
      await ConversationsService.updateLastMessageAndStatus({
        sender_id: sender_id,
        conversation_id: payload.conversation,
        message_id: newMessage.insertedId.toString()
      })
    }

    //
    return await MessageCollection.aggregate([
      {
        $match: { _id: newMessage.insertedId }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } }
    ]).next()
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
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } }
    ]).toArray()

    //
    const total = await MessageCollection.countDocuments({ conversation: new ObjectId(conversation_id) })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: messages
    }
  }

  async cleanupOldMessages() {
    const three_days_ago = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const limit = pLimit(10) // chỉ cho phép 10 task xóa chạy song song

    const conversations = await MessageCollection.aggregate([
      { $match: { created_at: { $lt: three_days_ago } } },
      { $group: { _id: '$conversation_id' } }
    ]).toArray()

    for (const conv of conversations) {
      const convId = conv._id

      const latestMessages = await MessageCollection.find({ conversation_id: convId })
        .sort({ created_at: -1 })
        .limit(500)
        .project({ _id: 1 })
        .toArray()

      const keepIds = latestMessages.map((m) => m._id)

      // Lấy danh sách message sẽ bị xóa
      const oldMessages = await MessageCollection.find({
        conversation_id: convId,
        created_at: { $lt: three_days_ago },
        _id: { $nin: keepIds }
      }).toArray()

      // Xóa media song song có giới hạn
      await Promise.all(
        oldMessages.map((msg) =>
          limit(async () => {
            await UploadsServices.delete({ s3_keys: msg.attachments?.map((att) => att.s3_key) || [] })
          })
        )
      )

      // Xóa message trong DB
      await MessageCollection.deleteMany({
        conversation_id: convId,
        created_at: { $lt: three_days_ago },
        _id: { $nin: keepIds }
      })
    }
  }

  async deleteConversationMessages(conversationId: string) {
    const convObjId = new ObjectId(conversationId)

    // Lấy toàn bộ message trong cuộc hội thoại
    const messages = await MessageCollection.find({ conversation: convObjId }).toArray()

    // Xóa file media trước
    console.log('messages to delete:', messages)

    for (const msg of messages) {
      console.log('msg to delete:', msg)
      if (!msg.attachments?.length) continue

      try {
        await UploadsServices.delete({ s3_keys: msg.attachments?.map((att) => att.s3_key) || [] })
      } catch (err) {
        console.error(`❌ Lỗi xóa media của message ${msg._id}:`, err)
      }
    }

    // Xóa toàn bộ message trong DB
    const { deletedCount } = await MessageCollection.deleteMany({ conversation: convObjId })
    console.log(`🧹 Đã xóa ${deletedCount} message trong conversation ${conversationId}`)
  }
}

export default new MessagesService()
