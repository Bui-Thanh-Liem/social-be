import { Collection, Db, ObjectId } from 'mongodb'
import { CONSTANT_INVITE_EXPIRES } from '~/shared/constants'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import { EActivityType, EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import {
  IActionActivity,
  ICommunity,
  ICommunityActivity,
  ICommunityInvitation,
  ICommunityMember,
  ICommunityMentor,
  ICommunityPin
} from '~/shared/interfaces/schemas/community.interface'
import { slug } from '~/utils/slug.util'
import { BaseSchema } from './Base.schema'
import { IMediaBare } from '~/shared/interfaces/schemas/media.interface'

// Cộng đồngđồng
export class CommunitySchema extends BaseSchema implements ICommunity {
  name: string
  slug: string
  cover?: IMediaBare
  desc: string
  bio: string
  admin: ObjectId
  category: string
  verify: boolean

  //
  visibility_type: EVisibilityType
  membership_type: EMembershipType
  show_log_for_member: boolean
  show_log_for_mentor: boolean
  show_invite_list_for_member: boolean
  show_invite_list_for_mentor: boolean
  invite_expire_days: number

  constructor(community: Partial<ICommunity>) {
    super()
    this.name = community.name || ''
    this.slug = slug(community?.name || '')
    this.desc = community.desc || ''
    this.cover = community.cover || undefined
    this.bio = community.bio || ''
    this.admin = community.admin || new ObjectId()
    this.category = community.category || ''
    this.verify = community.verify || false

    //
    this.visibility_type = community.visibility_type || EVisibilityType.Public
    this.membership_type = community.membership_type || EMembershipType.Open
    this.show_log_for_member = community.show_log_for_member || false
    this.show_log_for_mentor = community.show_log_for_mentor || false
    this.show_invite_list_for_member = community.show_invite_list_for_member || false
    this.show_invite_list_for_mentor = community.show_invite_list_for_mentor || false
    this.invite_expire_days = community.invite_expire_days || CONSTANT_INVITE_EXPIRES
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
  inviter: ObjectId
  user_id: ObjectId
  community_id: ObjectId
  status: EInvitationStatus

  constructor(invite: Partial<ICommunityInvitation>) {
    super()
    this.community_id = invite.community_id || new ObjectId()
    this.inviter = invite.inviter || new ObjectId()
    this.user_id = invite.user_id || new ObjectId()
    this.exp = invite.exp || new Date(Date.now() + CONSTANT_INVITE_EXPIRES * 24 * 60 * 60 * 1000)
    this.status = invite.status || EInvitationStatus.Pending
  }
}

// Những lời mời từ mentor
export class CommunityActivitySchema extends BaseSchema implements ICommunityActivity {
  action: IActionActivity
  actor_id: ObjectId
  community_id: ObjectId
  target_id?: ObjectId | undefined

  constructor(activity: Partial<ICommunityActivity>) {
    super()
    this.actor_id = activity.actor_id || new ObjectId()
    this.community_id = activity.community_id || new ObjectId()
    this.action = activity.action || { message: '', key: EActivityType.Invite }
    if (activity.target_id) this.target_id = activity.target_id
  }
}

export let CommunityCollection: Collection<CommunitySchema>
export let CommunityMentorCollection: Collection<CommunityMentorSchema>
export let CommunityMemberCollection: Collection<CommunityMemberSchema>
export let CommunityPinCollection: Collection<CommunityPinSchema>
export let CommunityInvitationCollection: Collection<CommunityInvitationSchema>
export let CommunityActivityCollection: Collection<CommunityActivitySchema>

export function initCommunityCollection(db: Db) {
  CommunityCollection = db.collection<CommunitySchema>('communities')
}

export function initCommunityMentorCollection(db: Db) {
  CommunityMentorCollection = db.collection<CommunityMentorSchema>('community-mentors')
}

export function initCommunityMemberCollection(db: Db) {
  CommunityMemberCollection = db.collection<CommunityMemberSchema>('community-members')
}

export function initCommunityPinCollection(db: Db) {
  CommunityPinCollection = db.collection<CommunityPinSchema>('community-pins')
}

export function initCommunityInvitationCollection(db: Db) {
  CommunityInvitationCollection = db.collection<CommunityInvitationSchema>('community-invitations')
}

export function initCommunityActivityCollection(db: Db) {
  CommunityActivityCollection = db.collection<CommunityActivitySchema>('community-activities')
}
