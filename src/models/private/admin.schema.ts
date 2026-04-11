import { Collection, Db } from 'mongodb'
import { BaseSchema } from '../../shared/schemas/base.schema'
import { IAdmin, ITwoFactorBackup } from '~/interfaces/private/admin.interface'
import { IMediaBare } from '~/shared/interfaces/media-bare.interface'
import { EAdminVerifyStatus } from '~/enums/private/admin.enum'

const COLLECTION_ADMIN_NAME = 'admins'
export class AdminSchema extends BaseSchema implements IAdmin {
  name: string
  email: string
  password: string
  avatar?: IMediaBare | undefined
  verify: EAdminVerifyStatus
  email_verify_token?: string | undefined
  forgot_password_token?: string | undefined
  two_factor_enabled: boolean
  two_factor_secret: string | null
  two_factor_session_enabled: boolean
  two_factor_backups: ITwoFactorBackup[]
  is_root_admin: boolean

  constructor(admin: Partial<IAdmin>) {
    super()
    this.name = admin.name || ''
    this.email = admin.email || ''
    this.password = admin.password || ''
    this.avatar = admin.avatar || undefined
    this.verify = admin.verify || EAdminVerifyStatus.Unverified
    this.email_verify_token = admin.email_verify_token || ''
    this.forgot_password_token = admin.forgot_password_token || ''
    this.two_factor_enabled = admin.two_factor_enabled || false
    this.two_factor_secret = admin.two_factor_secret || ''
    this.two_factor_session_enabled = admin.two_factor_session_enabled || false
    this.two_factor_backups = admin.two_factor_backups || []
    this.is_root_admin = admin.is_root_admin || false
  }
}

export let AdminCollection: Collection<AdminSchema>

export function initAdminCollection(db: Db) {
  AdminCollection = db.collection<AdminSchema>(COLLECTION_ADMIN_NAME)
}
