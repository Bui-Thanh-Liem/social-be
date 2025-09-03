import { ObjectId } from 'mongodb'
import { EConversationType } from '~/shared/enums/type.enum'
import { IBase } from './base.interface'

export interface IConversation extends IBase {
  name: string | null // group - có tên, private - lấy tên của participants (không phải mình)
  avatar: string[] | string | null // group - lấy tất cả avatar, private - lấy avatar của participants (không phải mình)
  type: EConversationType
  participants: ObjectId[]
  lastMessage: ObjectId | null
}
