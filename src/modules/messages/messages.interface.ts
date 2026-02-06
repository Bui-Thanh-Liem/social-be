import { ObjectId } from 'mongodb'
import { IBase } from '../../shared/interfaces/schemas/base.interface'
import { IMediaBare } from '../media/media.interface'
import { IConversation } from '../conversations/conversations.interface'

export interface IMessage extends IBase {
  sender: ObjectId
  conversation: ObjectId | IConversation
  content: string
  attachments: IMediaBare[] | null
}
