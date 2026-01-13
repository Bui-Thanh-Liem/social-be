import { ObjectId } from 'mongodb'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import type { EActivityType, EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import { type IBase } from './base.interface'
import { IUser } from './user.interface'
import { IMediaBare } from './media.interface'

export interface ICommunity extends IBase {
  name: string
  slug: string
  desc: string
  cover?: IMediaBare
  bio: string
  admin: ObjectId
  category: string
  verify: boolean

  //
  visibility_type: EVisibilityType // hiển thị nội dung cho người xem là thành viên hay mọi người
  membership_type: EMembershipType // Nhóm chỉ được mời mới được tham gia hay là mở để mọi người có thể tham gia
  show_log_for_member: boolean
  show_log_for_mentor: boolean
  show_invite_list_for_member: boolean
  show_invite_list_for_mentor: boolean
  invite_expire_days: number // Lời mời có hiệu lực trong

  pinned?: boolean
  is_joined?: boolean
  is_admin?: boolean
  is_member?: boolean
  is_mentor?: boolean
  member_count?: number

  members?: IUser[]
  mentors?: IUser[]
}

export interface ICommunityMentor extends IBase {
  user_id: ObjectId
  community_id: ObjectId
}

export interface ICommunityMember extends IBase, ICommunityMentor {}

export interface ICommunityPin extends IBase, ICommunityMentor {}

export interface ICommunityInvitation extends IBase {
  exp: Date
  inviter: ObjectId // người mời
  user_id: ObjectId // người nhận
  community_id: ObjectId
  status: EInvitationStatus
}

export interface IActionActivity {
  message: string
  key: EActivityType
}

export interface ICommunityActivity extends IBase {
  actor_id: ObjectId // người thực hiện hành động
  community_id: ObjectId // cộng đồng bị tác động
  action: IActionActivity // ví dụ: "join", "leave", "post_created", ...
  target_id?: ObjectId // nếu có đối tượng cụ thể (bài viết, bình luận, v.v.)
}
