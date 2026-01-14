import { ObjectId } from 'mongodb'
import { IBase } from './base.interface'
import { IConversation } from './conversation.interface'
import { IMediaBare } from './media.interface'

export interface IMessage extends IBase {
  sender: ObjectId
  conversation: ObjectId | IConversation
  content: string
  attachments: IMediaBare[] | null
}
