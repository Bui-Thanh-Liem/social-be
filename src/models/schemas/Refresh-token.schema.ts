import { Collection, Db, ObjectId } from 'mongodb'
import { IRefresh } from '~/shared/interfaces/schemas/refresh.interface'
import { BaseSchema } from './Base.schema'

export class RefreshTokenSchema extends BaseSchema implements IRefresh {
  token: string
  user_id: ObjectId
  iat: Date | undefined
  exp: Date | undefined

  constructor(data: IRefresh) {
    super()
    this.token = data.token
    this.user_id = data.user_id
    if (data.iat && typeof data.iat === 'number') this.iat = new Date(data.iat * 1000)
    if (data.exp && typeof data.exp === 'number') this.exp = new Date(data.exp * 1000)
  }
}

export let RefreshTokenCollection: Collection<RefreshTokenSchema>

export function initRefreshTokenCollection(db: Db) {
  RefreshTokenCollection = db.collection<RefreshTokenSchema>('refresh_tokens')
}
