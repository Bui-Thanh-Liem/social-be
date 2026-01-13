import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IBase } from './base.interface'
import { IMediaBare } from '../common/media-bare.interface'

export interface IUser extends IBase {
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

  //
  follower_count?: number
  following_count?: number
  isFollow?: boolean // người đang active và user đang truy vấnvấn
}
