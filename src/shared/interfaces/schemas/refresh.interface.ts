import { ObjectId } from 'mongodb'
import { IBase } from './base.interface'

export interface IRefresh extends IBase {
  user_id: ObjectId
  refresh_token: string
  refresh_token_used: string[]
  iat: Date | number | undefined
  exp: Date | number | undefined
}
