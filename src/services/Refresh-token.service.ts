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
    const filter = { token: refresh_token, user_id: new ObjectId(user_id) }
    await RefreshTokenCollection.findOneAndUpdate(
      filter,
      { $setOnInsert: new RefreshTokenSchema({ token: refresh_token, user_id: new ObjectId(user_id), iat, exp }) },
      { upsert: true, returnDocument: 'after' }
    )
  }

  async findOneByToken({ token }: { token: string }) {
    return await RefreshTokenCollection.findOne({ token })
  }

  async findOneByUserId({ user_id }: { user_id: string }) {
    return await RefreshTokenCollection.findOne({ user_id: new ObjectId(user_id) })
  }

  async deleteByToken({ token }: { token: string }) {
    return await RefreshTokenCollection.deleteOne({ token })
  }
}

export default new RefreshTokenService()
