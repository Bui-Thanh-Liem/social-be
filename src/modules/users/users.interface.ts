import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { IBase } from '~/shared/interfaces/base.interface'
import { EUserVerifyStatus, EUserStatus } from './users.enum'

// interface IUserSettings {
//   dark_mode: boolean
// }

//
export interface IUserStatus {
  status: EUserStatus
  reason: string
}

export interface IUser extends IBase {
  name: string
  email: string
  password: string
  day_of_birth: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify: EUserVerifyStatus
  status: IUserStatus

  //
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: IMediaBare
  cover_photo?: IMediaBare
  // settings: IUserSettings

  //
  follower_count?: number
  following_count?: number
  isFollow?: boolean // người đang active và user đang truy vấn
}
