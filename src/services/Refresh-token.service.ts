import { ObjectId } from 'mongodb'
import { RefreshTokenCollection, RefreshTokenSchema } from '~/models/schemas/Refresh-token.schema'

export class RefreshTokenService {
  async create({
    iat,
    exp,
    user_id,
    refresh_token
  }: {
    refresh_token: string
    user_id: string
    iat?: number
    exp?: number
  }) {
    await RefreshTokenCollection.insertOne(
      new RefreshTokenSchema({ token: refresh_token, user_id: new ObjectId(user_id), iat, exp })
    )
  }
}

export default new RefreshTokenService()
