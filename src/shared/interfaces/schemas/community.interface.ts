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
  visibilityType: EVisibilityType // tất cả mọi người đề thấy nhưng không thể tương tác
  membershipType: EMembershipType // chỉ members thấy

  category: string
  verify: boolean

  pinned?: boolean
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
  user_id: ObjectId
  community_id: ObjectId
  status: EInvitationStatus
}
