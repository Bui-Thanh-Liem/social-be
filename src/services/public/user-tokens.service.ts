import { ObjectId } from 'mongodb'
import { UserTokensCollection, UserTokensSchema } from '~/schemas/public/user-token.schema'

class UserTokensService {
  async create({
    iat,
    exp,
    user_id,
    refresh_token
  }: {
    iat?: number
    exp?: number
    user_id: string
    refresh_token: string
  }) {
    const filter = { user_id: new ObjectId(user_id), refresh_token: refresh_token }
    await UserTokensCollection.findOneAndUpdate(
      filter,
      {
        $setOnInsert: new UserTokensSchema({
          // khớp thì không làm, không khớp thì tạo mới
          iat,
          exp,
          refresh_token,
          user_id: new ObjectId(user_id)
        })
      },
      { upsert: true, returnDocument: 'after' }
    )
  }

  async updateTokenUsed({ token_used, new_token }: { token_used: string; new_token: string }) {
    return await UserTokensCollection.updateOne(
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
    return await UserTokensCollection.findOne({ refresh_token })
  }

  async findByRefreshTokenUsed({ refresh_token }: { refresh_token: string }) {
    return await UserTokensCollection.findOne({
      refresh_token_used: { $in: [refresh_token] }
    })
  }

  async findOneByUserId({ user_id }: { user_id: string }) {
    return await UserTokensCollection.findOne({ user_id: new ObjectId(user_id) })
  }

  async deleteByToken({ refresh_token }: { refresh_token: string }) {
    return await UserTokensCollection.deleteOne({ refresh_token })
  }

  async deleteByUserId({ user_id }: { user_id: string }) {
    return await UserTokensCollection.deleteOne({ user_id: new ObjectId(user_id) })
  }
}

export default new UserTokensService()
