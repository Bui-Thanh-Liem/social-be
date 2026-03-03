import { ObjectId } from 'mongodb'
import CacheService from '~/helpers/cache.helper'
import { IAdminToken } from './admin-tokens.interface'
import { AdminTokensCollection } from './admin-tokens.schema'
import { createKeyAdminAT } from '~/utils/create-key-cache.util'

export class AdminTokensService {
  async create({
    iat,
    exp,
    admin_id,
    access_token,
    refresh_token
  }: {
    iat?: number
    exp?: number
    admin_id: string
    access_token: string
    refresh_token: string
  }) {
    const filter = { admin_id: new ObjectId(admin_id) }
    const result = await AdminTokensCollection.findOneAndUpdate(
      filter,
      {
        $set: {
          access_token,
          refresh_token,
          iat: iat ? new Date(iat * 1000) : undefined,
          exp: exp ? new Date(exp * 1000) : undefined
        }
      },
      { upsert: true, returnDocument: 'before' }
    )

    return result
  }

  async updateTokenUsed({ token_used, new_token }: { token_used: string; new_token: string }) {
    return await AdminTokensCollection.updateOne(
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
    return await AdminTokensCollection.findOne({ refresh_token })
  }

  async findByAccessToken({ access_token }: { access_token: string }) {
    const keyCache = createKeyAdminAT(access_token)
    const cachedToken = await CacheService.get<IAdminToken>(keyCache)
    if (cachedToken) {
      return cachedToken
    } else {
      const token = await AdminTokensCollection.findOne({ access_token })
      if (token) {
        await CacheService.set(keyCache, token, 300)
      }
      return token
    }
  }

  async findByRefreshTokenUsed({ refresh_token }: { refresh_token: string }) {
    return await AdminTokensCollection.findOne({
      refresh_token_used: { $in: [refresh_token] }
    })
  }

  async findOneByAdminId({ admin_id }: { admin_id: string }) {
    return await AdminTokensCollection.findOne({ admin_id: new ObjectId(admin_id) })
  }

  async deleteByToken({ refresh_token }: { refresh_token: string }) {
    return await AdminTokensCollection.deleteOne({ refresh_token })
  }

  async deleteByAdminId({ admin_id }: { admin_id: string }) {
    return await AdminTokensCollection.deleteOne({ admin_id: new ObjectId(admin_id) })
  }
}

export default new AdminTokensService()
