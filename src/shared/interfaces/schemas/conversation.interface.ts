import { ObjectId } from 'mongodb'
import { EConversationType } from '~/shared/enums/type.enum'
import { IBase } from './base.interface'
import { IMedia } from './media.interface'
import { IMediaBare } from '../common/media-bare.interface'

export interface IConversation extends IBase {
  name: string | null // group - có tên, private - lấy tên của participants (không phải mình)
  avatar?: IMediaBare[] | IMediaBare | null // group - lấy tất cả avatar, private - lấy avatar của participants (không phải mình)
  type: EConversationType
  mentors: ObjectId[]
  participants: ObjectId[]
  deleted_for: ObjectId[]
  pinned: IPinned[]

  //
  lastMessage: ObjectId | null
  readStatus: ObjectId[] | null

  //
  username?: string // Đơn giản hóa tính năng xem trang cá nhân tại cuộc trò chuyện (type === private)
}

//
export interface IPinned {
  user_id: ObjectId
  at: Date
}
