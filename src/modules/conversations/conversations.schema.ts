import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { EConversationType } from '~/shared/enums/type.enum'
import { IConversation, IPinned } from '~/shared/interfaces/schemas/conversation.interface'
import { IMediaBare } from '~/shared/interfaces/schemas/media.interface'

export class ConversationsSchema extends BaseSchema implements IConversation {
  type: EConversationType
  mentors: ObjectId[]
  participants: ObjectId[]
  deleted_for: ObjectId[]
  lastMessage: null | ObjectId
  name: string | null
  avatar?: IMediaBare[] | IMediaBare | null
  readStatus: ObjectId[] | null
  pinned: IPinned[]

  constructor(conversation: Partial<IConversation>) {
    super()
    this.type = conversation.type || EConversationType.Private
    this.mentors = conversation.mentors || [new ObjectId()]
    this.participants = conversation.participants || [new ObjectId()]
    this.deleted_for = conversation.deleted_for || [new ObjectId()]
    this.pinned = conversation.pinned || []
    this.lastMessage = conversation.lastMessage || null
    this.name = conversation.name || null
    this.avatar = conversation.avatar || undefined
    this.readStatus = conversation.readStatus || null
  }
}

export let ConversationsCollection: Collection<ConversationsSchema>

export function initConversationsCollection(db: Db) {
  ConversationsCollection = db.collection<ConversationsSchema>('conversations')
}
