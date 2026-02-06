import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IBase } from '~/shared/interfaces/schemas/base.interface'
import { IMediaBare } from '~/modules/media/media.interface'

export interface IAdmin extends IBase {
  name: string
  email: string
  password: string
  avatar?: IMediaBare
  verify: EAuthVerifyStatus
  email_verify_token?: string
  forgot_password_token?: string
  twoFactorEnabled: boolean
  twoFactorSecret: string | null
}
