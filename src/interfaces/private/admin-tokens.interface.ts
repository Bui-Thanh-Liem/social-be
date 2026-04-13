import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/base.interface'

export interface IAdminToken extends IBase {
  admin_id: ObjectId
  refresh_token: string
  refresh_token_used: string[]
  iat: Date | number | undefined
  exp: Date | number | undefined
}
