import { Collection, Db } from 'mongodb'
import { IAdmin } from '~/shared/interfaces/schemas/admin.interface'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IMediaBare } from '~/shared/interfaces/schemas/media.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export class AdminSchema extends BaseSchema implements IAdmin {
  name: string
  email: string
  password: string
  avatar?: IMediaBare | undefined
  verify: EAuthVerifyStatus
  email_verify_token?: string | undefined
  forgot_password_token?: string | undefined
  twoFactorEnabled: boolean
  twoFactorSecret: string | null

  constructor(admin: Partial<IAdmin>) {
    super()
    this.name = admin.name || ''
    this.email = admin.email || ''
    this.password = admin.password || ''
    this.avatar = admin.avatar || undefined
    this.verify = admin.verify || EAuthVerifyStatus.Unverified
    this.email_verify_token = admin.email_verify_token || ''
    this.forgot_password_token = admin.forgot_password_token || ''
    this.twoFactorEnabled = admin.twoFactorEnabled || false
    this.twoFactorSecret = admin.twoFactorSecret || ''
  }
}

export let AdminCollection: Collection<AdminSchema>

export function initAdminCollection(db: Db) {
  AdminCollection = db.collection<AdminSchema>('admin')
}
