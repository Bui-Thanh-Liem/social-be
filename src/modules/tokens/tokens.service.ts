import { ObjectId } from 'mongodb'
import cacheService from '~/helpers/cache.helper'
import { shortKeyFromToken } from '~/utils/crypto.util'
import { IToken } from './tokens.interface'
import { TokensCollection } from './tokens.schema'

export class TokensService {
  async create({
    iat,
    exp,
    user_id,
    access_token,
    refresh_token
  }: {
    iat?: number
    exp?: number
    user_id: string
    refresh_token: string
    access_token: string
  }) {
    const filter = { user_id: new ObjectId(user_id) }
    await TokensCollection.findOneAndUpdate(
      filter,
      {
        $set: {
          access_token,
          refresh_token,
          iat: iat ? new Date(iat * 1000) : undefined,
          exp: exp ? new Date(exp * 1000) : undefined,
          user_id: new ObjectId(user_id)
        }
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

  async findByAccessToken({ access_token, user_id }: { access_token: string; user_id: string }) {
    const keyCache = `{user}:token_access:${shortKeyFromToken(access_token)}`
    const cachedToken = await cacheService.get<IToken>(keyCache)
    if (cachedToken) {
      return cachedToken
    } else {
      const token = await TokensCollection.findOne({ access_token, user_id: new ObjectId(user_id) })
      if (token) {
        await cacheService.set(keyCache, token, 300)
      }
      return token
    }
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
