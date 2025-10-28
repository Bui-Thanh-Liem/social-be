import { ObjectId } from 'mongodb'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import type { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import { type IBase } from './base.interface'
import { IUser } from './user.interface'

export interface ICommunity extends IBase {
  name: string
  slug: string
  desc: string
  cover: string
  bio: string
  admin: ObjectId
  category: string
  verify: boolean

  //
  visibilityType: EVisibilityType // tất cả mọi người đề thấy nhưng không thể tương tác
  membershipType: EMembershipType // chỉ members thấy
  showLogForMember: boolean
  showLogForMentor: boolean
  showInviteListForMember: boolean
  showInviteListForMentor: boolean
  inviteExpireDays: number // Lời mời có hiệu lực trong

  pinned?: boolean
  isJoined?: boolean
  isAdmin?: boolean
  isMember?: boolean
  isMentor?: boolean
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
