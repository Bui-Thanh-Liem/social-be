import { IMediaBare } from '~/shared/interfaces/common/media-bare.interface'
import { IBase } from '~/shared/interfaces/common/base.interface'
import { EUserStatus, EUserVerifyStatus } from '~/shared/enums/public/users.enum'
import { IReel } from './reel.interface'

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
  isPinnedReel: boolean
  cover_photo?: IMediaBare
  // settings: IUserSettings

  //
  follower_count?: number
  following_count?: number
  isFollow?: boolean // người đang active và user đang truy vấn
}
