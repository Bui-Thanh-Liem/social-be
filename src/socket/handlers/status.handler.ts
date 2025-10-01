import { ObjectId } from 'mongodb'
import { Server, Socket } from 'socket.io'
import cacheServiceInstance from '~/helpers/cache.helper'
import { ConversationCollection } from '~/models/schemas/Conversation.schema'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

// Xử lý onl/off user
export async function statusHandler(io: Server, socket: Socket) {
  //
  socket.on(CONSTANT_EVENT_NAMES.USER_ONLINE, async () => {
    const { user_id } = socket.decoded_authorization as IJwtPayload
    //
    await cacheServiceInstance.markUserOnline(user_id)

    // 1. Lấy tất cả conversation của user
    const conversations = await ConversationCollection.find({
      participants: {
        $in: [new ObjectId(user_id)]
      }, {
        projection: {
          participants: 1
        }
      }
    }).toArray()

    //

    // broadcast tin nhắn cho room / người nhận
    io.to('').emit(CONSTANT_EVENT_NAMES.NEW_MESSAGE, true)
  })
}
