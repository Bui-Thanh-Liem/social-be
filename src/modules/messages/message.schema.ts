import { Collection, Db, ObjectId } from 'mongodb'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { IMessage } from '~/shared/interfaces/schemas/message.interface'
import { IMediaBare } from '~/shared/interfaces/schemas/media.interface'
import { BaseSchema } from '~/schemas/Base.schema'

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
