import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/base.interface'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { EConversationType } from './conversations.enum'

export interface IConversation extends IBase {
  name: string | null // group - có tên, private - lấy tên của participants (không phải mình)
  avatar?: IMediaBare[] | IMediaBare | null // group - lấy tất cả avatar, private - lấy avatar của participants (không phải mình)
  type: EConversationType
  mentors: ObjectId[]
  participants: ObjectId[]
  deleted_for: ObjectId[]
  pinned: IPinned[]

  //
  last_message: ObjectId | null
  read_status: ObjectId[] | null

  //
  username?: string // Đơn giản hóa tính năng xem trang cá nhân tại cuộc trò chuyện (type === private)
}

//
export interface IPinned {
  user_id: ObjectId
  at: Date
}
