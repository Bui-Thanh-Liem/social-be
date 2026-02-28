import { Collection, Db } from 'mongodb'
import { IAdmin, ITwoFactorBackup } from '~/modules/admin/admin.interface'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IMediaBare } from '~/modules/media/media.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export class AdminSchema extends BaseSchema implements IAdmin {
  name: string
  email: string
  password: string
  avatar?: IMediaBare | undefined
  verify: EAuthVerifyStatus
  email_verify_token?: string | undefined
  forgot_password_token?: string | undefined
  two_factor_enabled: boolean
  two_factor_secret: string | null
  two_factor_session_enabled: boolean
  two_factor_backups: ITwoFactorBackup[]

  constructor(admin: Partial<IAdmin>) {
    super()
    this.name = admin.name || ''
    this.email = admin.email || ''
    this.password = admin.password || ''
    this.avatar = admin.avatar || undefined
    this.verify = admin.verify || EAuthVerifyStatus.Unverified
    this.email_verify_token = admin.email_verify_token || ''
    this.forgot_password_token = admin.forgot_password_token || ''
    this.two_factor_enabled = admin.two_factor_enabled || false
    this.two_factor_secret = admin.two_factor_secret || ''
    this.two_factor_session_enabled = admin.two_factor_session_enabled || false
    this.two_factor_backups = admin.two_factor_backups || []
  }
}

export let AdminCollection: Collection<AdminSchema>

export function initAdminCollection(db: Db) {
  AdminCollection = db.collection<AdminSchema>('admin')
}
