import { ObjectId } from 'mongodb'
import { EConversationType } from '~/shared/enums/type.enum'
import { IBase } from './base.interface'

export interface IConversation extends IBase {
  name: string | null // chỉ có khi là group
  type: EConversationType
  participants: ObjectId[]
  lastMessage: ObjectId | null
}
