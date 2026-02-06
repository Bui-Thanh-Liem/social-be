import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IBase } from '~/shared/interfaces/schemas/base.interface'
import { IMediaBare } from '../media/media.interface'

// interface IUserSettings {
//   dark_mode: boolean
// }

export interface IUser extends IBase {
  name: string
  email: string
  password: string
  day_of_birth: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify: EAuthVerifyStatus

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
