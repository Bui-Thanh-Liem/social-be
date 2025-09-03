import { Collection, Db, ObjectId } from 'mongodb'
import { EConversationType } from '~/shared/enums/type.enum'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { BaseSchema } from './Base.schema'

export class ConversationSchema extends BaseSchema implements IConversation {
  type: EConversationType
  participants: ObjectId[]
  lastMessage: null | ObjectId
  name: string | null
  avatar: string | string[] | null

  constructor(conversation: Partial<IConversation>) {
    super()
    this.type = conversation.type || EConversationType.Private
    this.participants = conversation.participants || [new ObjectId()]
    this.lastMessage = conversation.lastMessage || null
    this.name = conversation.name || null
    this.avatar = conversation.avatar || null
  }
}

export let ConversationCollection: Collection<ConversationSchema>

export function initConversationCollection(db: Db) {
  ConversationCollection = db.collection<ConversationSchema>('conversations')
}
