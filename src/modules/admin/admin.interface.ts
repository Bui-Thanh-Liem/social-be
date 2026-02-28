import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IBase } from '~/shared/interfaces/schemas/base.interface'
import { IMediaBare } from '~/modules/media/media.interface'

export interface ITwoFactorBackup {
  secret: string
  used: boolean
  used_at: Date
}

export interface IAdmin extends IBase {
  name: string
  email: string
  password: string
  avatar?: IMediaBare
  verify: EAuthVerifyStatus
  email_verify_token?: string
  forgot_password_token?: string
  two_factor_enabled: boolean
  two_factor_secret: string | null
  two_factor_session_enabled: boolean
  two_factor_backups: ITwoFactorBackup[]
}
