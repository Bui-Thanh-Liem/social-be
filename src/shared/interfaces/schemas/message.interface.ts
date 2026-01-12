import { ObjectId } from 'mongodb'
import { IMedia } from './media.interface'
import { IBase } from './base.interface'
import { IConversation } from './conversation.interface'

export interface IMessage extends IBase {
  sender: ObjectId
  conversation: ObjectId | IConversation
  content: string
  attachments: IMedia[] | undefined
}
