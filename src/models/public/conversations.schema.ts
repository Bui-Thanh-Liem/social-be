import { Collection, Db, ObjectId } from 'mongodb'
import { EConversationType } from '~/enums/public/conversations.enum'
import { IConversation, IPinned } from '~/interfaces/public/conversations.interface'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

const COLLECTION_NAME = 'conversations'
export class ConversationsSchema extends BaseSchema implements IConversation {
  type: EConversationType
  mentors: ObjectId[]
  participants: ObjectId[]
  deleted_for: ObjectId[]
  last_message: null | ObjectId
  name: string | null
  avatar?: IMediaBare[] | IMediaBare | null
  read_status: ObjectId[] | null
  pinned: IPinned[]

  constructor(conversation: Partial<IConversation>) {
    super()
    this.type = conversation.type || EConversationType.Private
    this.mentors = conversation.mentors || [new ObjectId()]
    this.participants = conversation.participants || [new ObjectId()]
    this.deleted_for = conversation.deleted_for || [new ObjectId()]
    this.pinned = conversation.pinned || []
    this.last_message = conversation.last_message || null
    this.name = conversation.name || null
    this.avatar = conversation.avatar || undefined
    this.read_status = conversation.read_status || null
  }
}

export let ConversationsCollection: Collection<ConversationsSchema>

export function initConversationsCollection(db: Db) {
  ConversationsCollection = db.collection<ConversationsSchema>(COLLECTION_NAME)
}
