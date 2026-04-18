import { ObjectId } from 'mongodb'
import { AdminTokensCollection, AdminTokensSchema } from '~/schemas/private/admin-tokens.schema'

class AdminTokensService {
  async create({
    iat,
    exp,
    admin_id,
    refresh_token
  }: {
    iat?: number
    exp?: number
    admin_id: string
    refresh_token: string
  }) {
    const filter = { admin_id: new ObjectId(admin_id) }
    await AdminTokensCollection.findOneAndUpdate(
      filter,
      {
        $setOnInsert: new AdminTokensSchema({
          // khớp thì không làm, không khớp thì tạo mới
          iat,
          exp,
          refresh_token,
          admin_id: new ObjectId(admin_id)
        })
      },
      { upsert: true, returnDocument: 'after' }
    )
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
