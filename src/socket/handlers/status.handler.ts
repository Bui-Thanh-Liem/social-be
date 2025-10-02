import { ObjectId } from 'mongodb'
import { Server } from 'socket.io'
import cacheServiceInstance from '~/helpers/cache.helper'
import { ConversationCollection } from '~/models/schemas/Conversation.schema'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'

//
export async function statusHandler(io: Server, user_id: string, handle?: 'onl' | 'off') {
  //
  if (handle === 'onl') {
    await cacheServiceInstance.markUserOnline(user_id)
  }

  //
  if (handle === 'off') {
    await cacheServiceInstance.markUserOffline(user_id)
  }

  // 1. Lấy tất cả conversation của user
  const userObjectId = new ObjectId(user_id)
  const convs = await ConversationCollection.find(
    {
      participants: {
        $in: [userObjectId]
      },
      deletedFor: {
        $nin: [userObjectId]
      }
    },
    {
      projection: {
        participants: 1
      }
    }
  ).toArray()

  // Đánh dấu phòng nào onl/off
  const result = await getConversationsWithOnlineParticipants(convs, user_id)

  //
  result.forEach((conv) => {
    io.to(conv._id!.toString()).emit(CONSTANT_EVENT_NAMES.USER_ONLINE, conv)
  })
}

//
async function getConversationsWithOnlineParticipants(
  conversations: IConversation[],
  currentUserId: string
): Promise<{ _id: ObjectId | undefined; hasOnline: boolean }[]> {
  // B1: Lấy toàn bộ participants (trừ currentUser)
  const allOtherUsers = Array.from(
    new Set(conversations.flatMap((c) => c.participants).filter((u) => !u.equals(new ObjectId(currentUserId))))
  )

  // B2: Check online 1 lần cho tất cả users
  const onlineMap = await cacheServiceInstance.areUsersOnline(allOtherUsers.map((i) => i.toString()))

  // B3: Gắn vào từng conversation
  return conversations.map((c) => {
    const hasOnline = c.participants.some((u) => u.toString() !== currentUserId && onlineMap[u.toString()] === true)
    return { _id: c._id, hasOnline }
  })
}
