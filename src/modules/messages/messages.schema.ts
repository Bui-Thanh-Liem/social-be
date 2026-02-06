import { Collection, Db, ObjectId } from 'mongodb'
import { IMessage } from '~/modules/messages/messages.interface'
import { IMediaBare } from '~/modules/media/media.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IConversation } from '../conversations/conversations.interface'

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
  MessagesCollection = db.collection<MessagesSchema>('messages')
}
