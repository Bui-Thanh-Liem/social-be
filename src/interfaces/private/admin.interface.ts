import { EAdminVerifyStatus } from '~/enums/private/admin.enum'
import { IBase } from '../../shared/interfaces/base.interface'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'

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
  is_root_admin: boolean
  verify: EAdminVerifyStatus
  email_verify_token?: string
  forgot_password_token?: string
  two_factor_enabled: boolean
  two_factor_secret: string | null
  two_factor_session_enabled: boolean
  two_factor_backups: ITwoFactorBackup[]
}
