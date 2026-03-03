import { ObjectId } from 'mongodb'
import { IBase } from '../../shared/interfaces/base.interface'
import { IConversation } from '../conversations/conversations.interface'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'

export interface IMessage extends IBase {
  sender: ObjectId
  conversation: ObjectId | IConversation
  content: string
  attachments: IMediaBare[] | null
}
