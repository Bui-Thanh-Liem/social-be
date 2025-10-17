import { ObjectId } from 'mongodb'
import type { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import { type IBase } from './base.interface'

export interface ICommunity extends IBase {
  name: string
  desc: string
  cover: string
  bio: string
  admin: ObjectId
  visibilityType: EVisibilityType // tất cả mọi người đề thấy nhưng không thể tương tác
  membershipType: EMembershipType // chỉ members thấy

  category: string
  verify: boolean
}

export interface ICommunityMentor extends IBase {
  user_id: ObjectId
  community_id: ObjectId
}

export interface ICommunityMember extends IBase, ICommunityMentor {}

export interface ICommunityPin extends IBase, ICommunityMentor {}
