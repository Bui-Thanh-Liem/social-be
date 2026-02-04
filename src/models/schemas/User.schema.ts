import { Collection, Db } from 'mongodb'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { BaseSchema } from './Base.schema'
import { IMediaBare } from '~/shared/interfaces/schemas/media.interface'

const _COLLECTION_NAME = 'users'
export class UserSchema extends BaseSchema implements IUser {
  name: string
  email: string
  password: string
  day_of_birth: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify: EAuthVerifyStatus
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: IMediaBare
  cover_photo?: IMediaBare

  constructor(user: Partial<IUser>) {
    super()
    this.name = user.name || ''
    this.email = user.email || ''
    this.password = user.password || ''
    this.day_of_birth = user.day_of_birth || new Date()
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || EAuthVerifyStatus.Unverified
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.avatar = user.avatar || undefined
    this.cover_photo = user.cover_photo || undefined
  }
}

export let UserCollection: Collection<UserSchema>

export function initUserCollection(db: Db) {
  UserCollection = db.collection<UserSchema>(_COLLECTION_NAME)
}
