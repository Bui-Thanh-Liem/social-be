import { Collection, Db, ObjectId } from 'mongodb'
import { IUserToken } from '~/interfaces/user-tokens.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export const COLLECTION_USER_TOKENS_NAME = 'user-tokens'
export class UserTokensSchema extends BaseSchema implements IUserToken {
  user_id: ObjectId
  refresh_token: string
  iat: Date | undefined
  exp: Date | undefined
  refresh_token_used: string[]

  constructor(token: Pick<IUserToken, 'user_id' | 'refresh_token' | 'iat' | 'exp'>) {
    super()
    this.refresh_token_used = [] // Mới tạo thì chưa có token nào đã sử dụng.
    this.user_id = token.user_id
    this.refresh_token = token.refresh_token
    if (token.iat && typeof token.iat === 'number') this.iat = new Date(token.iat * 1000)
    if (token.exp && typeof token.exp === 'number') this.exp = new Date(token.exp * 1000)
  }
}

export let UserTokensCollection: Collection<UserTokensSchema>

export function initUserTokensCollection(db: Db) {
  UserTokensCollection = db.collection<UserTokensSchema>(COLLECTION_USER_TOKENS_NAME)
}
