import { Collection, Db, ObjectId } from 'mongodb'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import {
  ICommunity,
  ICommunityMember,
  ICommunityMentor,
  ICommunityPin
} from '~/shared/interfaces/schemas/community.interface'
import { BaseSchema } from './Base.schema'
import { slug } from '~/utils/slug.util'

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
    this.slug = slug(this.name)
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

export class CommunityMentorSchema extends BaseSchema implements ICommunityMentor {
  user_id: ObjectId
  community_id: ObjectId

  constructor(obj: Partial<ICommunityMentor>) {
    super()
    this.user_id = obj.user_id || new ObjectId()
    this.community_id = obj.community_id || new ObjectId()
  }
}

export class CommunityMemberSchema extends BaseSchema implements ICommunityMember {
  user_id: ObjectId
  community_id: ObjectId

  constructor(obj: Partial<ICommunityMember>) {
    super()
    this.user_id = obj.user_id || new ObjectId()
    this.community_id = obj.community_id || new ObjectId()
  }
}

export class CommunityPinSchema extends BaseSchema implements ICommunityPin {
  user_id: ObjectId
  community_id: ObjectId

  constructor(obj: Partial<ICommunityPin>) {
    super()
    this.user_id = obj.user_id || new ObjectId()
    this.community_id = obj.community_id || new ObjectId()
  }
}

export let CommunityCollection: Collection<CommunitySchema>
export let CommunityMentorCollection: Collection<CommunityMentorSchema>
export let CommunityMemberCollection: Collection<CommunityMemberSchema>
export let CommunityPinCollection: Collection<CommunityPinSchema>

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
