import { ObjectId } from 'mongodb'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { IMedia } from '~/modules/media/media.interface'
import { IMessage } from '~/modules/messages/messages.interface'
import { IQuery } from '~/shared/interfaces/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import ConversationsService from '../conversations/conversations.service'
import UploadsServices from '../uploads/uploads.service'
import { COLLECTION_USER_NAME } from '../users/users.schema'
import { CreateMessageDto } from './messages.dto'
import { MessagesCollection, MessagesSchema } from './messages.schema'

class MessagesService {
  async create(sender_id: string, payload: CreateMessageDto) {
    //
    let _attachments: undefined | IMedia[] = undefined
    if (payload.attachments) {
      _attachments = await UploadsServices.getMultiByKeys(payload.attachments.map((a) => a.s3_key))
    }

    //
    const newMessage = await MessagesCollection.insertOne(
      new MessagesSchema({
        content: payload.content,
        sender: new ObjectId(sender_id),
        attachments: _attachments,
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

    // Lấy lại message vừa tạo với thông tin đầy đủ
    const message = await MessagesCollection.aggregate<IMessage>([
      {
        $match: { _id: newMessage.insertedId }
      },
      {
        $lookup: {
          from: COLLECTION_USER_NAME,
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [
            {
              $project: {
                name: 1,
                avatar: 1,
                username: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } }
    ]).next()

    return this.signedCloudfrontMediaUrls(message) as IMessage
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
    const messages = await MessagesCollection.aggregate<MessagesSchema>([
      {
        $match: { conversation: new ObjectId(conversation_id) }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: COLLECTION_USER_NAME,
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
    const total = await MessagesCollection.countDocuments({ conversation: new ObjectId(conversation_id) })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontMediaUrls(messages) as IMessage[]
    }
  }

  // async cleanupOldMessages() {
  //   const three_days_ago = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  //   const limit = pLimit(10) // chỉ cho phép 10 task xóa chạy song song

  //   const conversations = await MessagesCollection.aggregate([
  //     { $match: { created_at: { $lt: three_days_ago } } },
  //     { $group: { _id: '$conversation_id' } }
  //   ]).toArray()

  //   for (const conv of conversations) {
  //     const convId = conv._id

  //     const latestMessages = await MessagesCollection.find({ conversation_id: convId })
  //       .sort({ created_at: -1 })
  //       .limit(500)
  //       .project({ _id: 1 })
  //       .toArray()

  //     const keepIds = latestMessages.map((m) => m._id)

  //     // Lấy danh sách message sẽ bị xóa
  //     const oldMessages = await MessagesCollection.find({
  //       conversation_id: convId,
  //       created_at: { $lt: three_days_ago },
  //       _id: { $nin: keepIds }
  //     }).toArray()

  //     // Xóa media song song có giới hạn
  //     await Promise.all(
  //       oldMessages.map((msg) =>
  //         limit(async () => {
  //           await UploadsServices.delete({ s3_keys: msg.attachments?.map((att) => att.s3_key) || [] })
  //         })
  //       )
  //     )

  //     // Xóa message trong DB
  //     await MessagesCollection.deleteMany({
  //       conversation_id: convId,
  //       created_at: { $lt: three_days_ago },
  //       _id: { $nin: keepIds }
  //     })
  //   }
  // }

  async deleteConversationMessages(conversationId: string) {
    const convObjId = new ObjectId(conversationId)

    // Lấy toàn bộ message trong cuộc hội thoại
    const messages = await MessagesCollection.find({ conversation: convObjId }).toArray()

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
    const { deletedCount } = await MessagesCollection.deleteMany({ conversation: convObjId })
    console.log(`🧹 Đã xóa ${deletedCount} message trong conversation ${conversationId}`)
  }

  //
  private signedCloudfrontMediaUrls = (mess: IMessage[] | IMessage | null) => {
    //
    if (!mess) return mess

    //
    if (!Array.isArray(mess))
      return {
        ...mess,
        attachments: mess.attachments?.map((a) => ({
          ...a,
          ...signedCloudfrontUrl(a)
        })) as any
      }

    //
    return mess.map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({
        ...a,
        ...signedCloudfrontUrl(a)
      })) as any
    }))
  }
}

export default new MessagesService()
