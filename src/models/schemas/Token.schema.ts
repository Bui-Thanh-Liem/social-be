import { Collection, Db, ObjectId } from 'mongodb'
import { IRefresh } from '~/shared/interfaces/schemas/refresh.interface'
import { BaseSchema } from './Base.schema'

export class TokenSchema extends BaseSchema implements IRefresh {
  user_id: ObjectId
  refresh_token: string
  iat: Date | undefined
  exp: Date | undefined
  refresh_token_used: string[]

  constructor(token: Pick<IRefresh, 'user_id' | 'refresh_token' | 'iat' | 'exp'>) {
    super()
    this.refresh_token_used = [] // Mới tạo thì chưa có token nào đã sử dụng.
    this.user_id = token.user_id
    this.refresh_token = token.refresh_token
    if (token.iat && typeof token.iat === 'number') this.iat = new Date(token.iat * 1000)
    if (token.exp && typeof token.exp === 'number') this.exp = new Date(token.exp * 1000)
  }
}

export let TokenCollection: Collection<TokenSchema>

export function initTokenCollection(db: Db) {
  TokenCollection = db.collection<TokenSchema>('tokens')
}
