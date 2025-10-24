import { Collection, Db, ObjectId } from 'mongodb'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import {
  ICommunity,
  ICommunityInvitation,
  ICommunityMember,
  ICommunityMentor,
  ICommunityPin
} from '~/shared/interfaces/schemas/community.interface'
import { slug } from '~/utils/slug.util'
import { BaseSchema } from './Base.schema'

// Cộng đồngđồng
export class CommunitySchema extends BaseSchema implements ICommunity {
  name: string
  slug: string
  cover: string
  desc: string
  bio: string
  admin: ObjectId
  visibilityType: EVisibilityType
  membershipType: EMembershipType
  category: string
  verify: boolean

  constructor(community: Partial<ICommunity>) {
    super()
    this.name = community.name || ''
    this.slug = slug(community?.name || '')
    this.desc = community.desc || ''
    this.cover = community.cover || ''
    this.bio = community.bio || ''
    this.admin = community.admin || new ObjectId()
    this.visibilityType = community.visibilityType || EVisibilityType.Public
    this.membershipType = community.membershipType || EMembershipType.Open
    this.category = community.category || ''
    this.verify = community.verify || false
  }
}

// Mentor trong cộng đồng
export class CommunityMentorSchema extends BaseSchema implements ICommunityMentor {
  user_id: ObjectId
  community_id: ObjectId

  constructor(obj: Partial<ICommunityMentor>) {
    super()
    this.user_id = obj.user_id || new ObjectId()
    this.community_id = obj.community_id || new ObjectId()
  }
}

// Member trong cộng đồng
export class CommunityMemberSchema extends BaseSchema implements ICommunityMember {
  user_id: ObjectId
  community_id: ObjectId

  constructor(obj: Partial<ICommunityMember>) {
    super()
    this.user_id = obj.user_id || new ObjectId()
    this.community_id = obj.community_id || new ObjectId()
  }
}

// Những cộng đồng được người dùng ghim
export class CommunityPinSchema extends BaseSchema implements ICommunityPin {
  user_id: ObjectId
  community_id: ObjectId

  constructor(obj: Partial<ICommunityPin>) {
    super()
    this.user_id = obj.user_id || new ObjectId()
    this.community_id = obj.community_id || new ObjectId()
  }
}

// Những lời mời từ mentor
export class CommunityInvitationSchema extends BaseSchema implements ICommunityInvitation {
  exp: Date
  user_id: ObjectId
  community_id: ObjectId
  status: EInvitationStatus

  constructor(invite: Partial<ICommunityInvitation>) {
    super()
    this.community_id = invite.community_id || new ObjectId()
    this.user_id = invite.user_id || new ObjectId()
    this.exp = invite.exp || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 ngày
    this.status = invite.status || EInvitationStatus.Pending
  }
}

export let CommunityCollection: Collection<CommunitySchema>
export let CommunityMentorCollection: Collection<CommunityMentorSchema>
export let CommunityMemberCollection: Collection<CommunityMemberSchema>
export let CommunityPinCollection: Collection<CommunityPinSchema>
export let CommunityInvitationCollection: Collection<CommunityInvitationSchema>

export function initCommunityCollection(db: Db) {
  CommunityCollection = db.collection<CommunitySchema>('community')
}

export function initCommunityMentorCollection(db: Db) {
  CommunityMentorCollection = db.collection<CommunityMentorSchema>('community-mentor')
}

export function initCommunityMemberCollection(db: Db) {
  CommunityMemberCollection = db.collection<CommunityMemberSchema>('community-member')
}

export function initCommunityPinCollection(db: Db) {
  CommunityPinCollection = db.collection<CommunityPinSchema>('community-pin')
}

export function initCommunityInvitationCollection(db: Db) {
  CommunityInvitationCollection = db.collection<CommunityInvitationSchema>('community-invitation')
}
