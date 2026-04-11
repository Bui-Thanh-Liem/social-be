import { Collection, Db, ObjectId } from 'mongodb'
import { IConversation } from '~/interfaces/public/conversations.interface'
import { IMessage } from '~/interfaces/public/messages.interface'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export const COLLECTION_MESSAGES_NAME = 'messages'
export class MessagesSchema extends BaseSchema implements IMessage {
  sender: ObjectId
  content: string
  conversation: ObjectId | IConversation
  attachments: IMediaBare[] | null

  constructor(message: Partial<IMessage>) {
    super()
    this.sender = message.sender || new ObjectId()
    this.content = message.content || ''
    this.conversation = message.conversation || new ObjectId()
    this.attachments = message.attachments || []
  }
}

export let MessagesCollection: Collection<MessagesSchema>

export function initMessagesCollection(db: Db) {
  MessagesCollection = db.collection<MessagesSchema>(COLLECTION_MESSAGES_NAME)
}
