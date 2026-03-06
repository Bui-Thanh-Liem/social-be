import { Collection, Db } from 'mongodb'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { EUserStatus, EUserVerifyStatus } from './users.enum'
import { IUser, IUserStatus } from './users.interface'

export const COLLECTION_USER_NAME = 'users'
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
  cover_photo?: IMediaBare
  status: IUserStatus

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
    this.avatar = user.avatar || undefined
    this.cover_photo = user.cover_photo || undefined
  }
}

export let UsersCollection: Collection<UsersSchema>

export function initUsersCollection(db: Db) {
  UsersCollection = db.collection<UsersSchema>(COLLECTION_USER_NAME)
}
