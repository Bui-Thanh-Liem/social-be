import { ObjectId } from 'mongodb'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { IBase } from '../../shared/interfaces/base.interface'
import { IConversation } from './conversations.interface'

export interface IMessage extends IBase {
  sender: ObjectId
  conversation: ObjectId | IConversation
  content: string
  attachments: IMediaBare[] | null
}
