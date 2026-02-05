import { ObjectId } from 'mongodb'
import { TokensCollection, TokensSchema } from './tokens.schema'

export class TokensService {
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
    const filter = { refresh_token, user_id: new ObjectId(user_id) }
    await TokensCollection.findOneAndUpdate(
      filter,
      {
        $setOnInsert: new TokensSchema({ refresh_token, user_id: new ObjectId(user_id), iat, exp })
      },
      { upsert: true, returnDocument: 'after' }
    )
  }

  async updateTokenUsed({ token_used, new_token }: { token_used: string; new_token: string }) {
    return await TokensCollection.updateOne(
      { refresh_token: token_used },
      {
        $set: {
          refresh_token: new_token
        },
        $push: {
          refresh_token_used: token_used
        }
      }
    )
  }

  async findByRefreshToken({ refresh_token }: { refresh_token: string }) {
    return await TokensCollection.findOne({ refresh_token })
  }

  async findByRefreshTokenUsed({ refresh_token }: { refresh_token: string }) {
    return await TokensCollection.findOne({
      refresh_token_used: { $in: [refresh_token] }
    })
  }

  async findOneByUserId({ user_id }: { user_id: string }) {
    return await TokensCollection.findOne({ user_id: new ObjectId(user_id) })
  }

  async deleteByToken({ refresh_token }: { refresh_token: string }) {
    return await TokensCollection.deleteOne({ refresh_token })
  }

  async deleteByUserId({ user_id }: { user_id: string }) {
    return await TokensCollection.deleteOne({ user_id: new ObjectId(user_id) })
  }
}

export default new TokensService()
