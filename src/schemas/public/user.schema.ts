import { Collection, Db } from 'mongodb'
import { IUser, IUserSettings, IUserStatus } from '~/shared/interfaces/public/user.interface'
import { IMediaBare } from '~/shared/interfaces/common/media-bare.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { EUserStatus, EUserType, EUserVerifyStatus } from '../../shared/enums/public/users.enum'

export const COLLECTION_USERS_NAME = 'users'
export class UsersSchema extends BaseSchema implements IUser {
  name: string
  email: string
  password: string
  day_of_birth: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify: EUserVerifyStatus
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: IMediaBare
  isPinReel?: boolean
  cover_photo?: IMediaBare
  status: IUserStatus
  isPinnedReel: boolean
  type: EUserType
  follower_count: number
  following_count: number
  settings: IUserSettings

  constructor(user: Partial<IUser>) {
    super()
    this.name = user.name || ''
    this.email = user.email || ''
    this.password = user.password || ''
    this.day_of_birth = user.day_of_birth || new Date()
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || EUserVerifyStatus.Unverified
    this.bio = user.bio || ''
    this.status = user.status || { status: EUserStatus.Active, reason: '' }
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.isPinnedReel = user.isPinnedReel || false
    this.avatar = user.avatar || undefined
    this.cover_photo = user.cover_photo || undefined
    this.type = EUserType.Normal
    this.follower_count = 0
    this.following_count = 0
    this.settings = { dark_mode: false }
  }
}

export let UsersCollection: Collection<UsersSchema>

export function initUsersCollection(db: Db) {
  UsersCollection = db.collection<UsersSchema>(COLLECTION_USERS_NAME)
}
