import { ObjectId } from 'mongodb'
import { IMediaBare } from '~/shared/interfaces/common/media-bare.interface'
import { IBase } from '../common/base.interface'
import { IConversation } from './conversation.interface'

export interface IMessage extends IBase {
  sender: ObjectId
  conversation: ObjectId | IConversation
  content: string
  attachments: IMediaBare[] | null
}
