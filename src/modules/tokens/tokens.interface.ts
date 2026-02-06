import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/schemas/base.interface'

export interface IToken extends IBase {
  user_id: ObjectId
  refresh_token: string
  refresh_token_used: string[]
  iat: Date | number | undefined
  exp: Date | number | undefined
}
