import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IAdminToken } from './admin-tokens.interface'

export class AdminTokensSchema extends BaseSchema implements IAdminToken {
  admin_id: ObjectId
  access_token: string
  refresh_token: string
  iat: Date | undefined
  exp: Date | undefined
  refresh_token_used: string[]

  constructor(token: Pick<IAdminToken, 'admin_id' | 'access_token' | 'refresh_token' | 'iat' | 'exp'>) {
    super()
    this.refresh_token_used = [] // Mới tạo thì chưa có token nào đã sử dụng.
    this.admin_id = token.admin_id
    this.access_token = token.access_token
    this.refresh_token = token.refresh_token
    if (token.iat && typeof token.iat === 'number') this.iat = new Date(token.iat * 1000)
    if (token.exp && typeof token.exp === 'number') this.exp = new Date(token.exp * 1000)
  }
}

export let AdminTokensCollection: Collection<AdminTokensSchema>

export function initAdminTokensCollection(db: Db) {
  AdminTokensCollection = db.collection<AdminTokensSchema>('admin-tokens')
}
