import { Collection, Db, ObjectId } from 'mongodb'
import { EConversationType } from '~/shared/enums/type.enum'
import { IConversation, IPinned } from '~/shared/interfaces/schemas/conversation.interface'
import { BaseSchema } from './Base.schema'

export class ConversationSchema extends BaseSchema implements IConversation {
  type: EConversationType
  mentors: ObjectId[]
  participants: ObjectId[]
  deletedFor: ObjectId[]
  lastMessage: null | ObjectId
  name: string | null
  avatar: string | string[] | null
  readStatus: ObjectId[] | null
  pinned: IPinned[]

  constructor(conversation: Partial<IConversation>) {
    super()
    this.type = conversation.type || EConversationType.Private
    this.mentors = conversation.mentors || [new ObjectId()]
    this.participants = conversation.participants || [new ObjectId()]
    this.deletedFor = conversation.deletedFor || [new ObjectId()]
    this.pinned = conversation.pinned || []
    this.lastMessage = conversation.lastMessage || null
    this.name = conversation.name || null
    this.avatar = conversation.avatar || null
    this.readStatus = conversation.readStatus || null
  }
}

export let ConversationCollection: Collection<ConversationSchema>

export function initConversationCollection(db: Db) {
  ConversationCollection = db.collection<ConversationSchema>('conversations')
}
