import { Collection, Db, ObjectId } from 'mongodb'
import { EConversationType } from '~/shared/enums/type.enum'
import { IConversation, IPinned } from '~/shared/interfaces/schemas/conversation.interface'
import { BaseSchema } from './Base.schema'
import { IMediaBare } from '~/shared/interfaces/common/media-bare.interface'

export class ConversationSchema extends BaseSchema implements IConversation {
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

export let ConversationCollection: Collection<ConversationSchema>

export function initConversationCollection(db: Db) {
  ConversationCollection = db.collection<ConversationSchema>('conversations')
}
