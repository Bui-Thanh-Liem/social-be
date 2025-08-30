import { Collection, Db, ObjectId } from 'mongodb'
import { IConversation } from '~/shared/interfaces/schemas/conversation.interface'
import { IMessage } from '~/shared/interfaces/schemas/message.interface'
import { BaseSchema } from './Base.schema'

export class MessageSchema extends BaseSchema implements IMessage {
  sender: ObjectId
  content: string
  conversation: ObjectId | IConversation
  attachments: string[]

  constructor(message: Partial<IMessage>) {
    super()
    this.sender = message.sender || new ObjectId()
    this.content = message.content || ''
    this.conversation = message.conversation || new ObjectId()
    this.attachments = message.attachments || []
  }
}

export let MessageCollection: Collection<MessageSchema>

export function initMessageCollection(db: Db) {
  MessageCollection = db.collection<MessageSchema>('messages')
}
