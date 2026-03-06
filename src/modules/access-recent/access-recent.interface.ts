import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/base.interface'

export interface IAccessRecent extends IBase {
  ref_id: ObjectId
  ref_slug?: string // Dùng để lưu tên hiển thị của ref_id (như username, community name, tweet content...) để tránh phải join khi lấy danh sách truy cập gần đây
  user_id: ObjectId
  type: 'tweet' | 'community' | 'user'
}
