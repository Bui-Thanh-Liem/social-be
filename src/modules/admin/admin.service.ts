import { ObjectId } from 'mongodb'
import { envs } from '~/configs/env.config'
import { NotFoundError, UnauthorizedError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { AdminCollection } from '~/modules/admin/admin.schema'
import { LoginAuthDto } from '~/shared/dtos/req/auth.dto'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IAdmin } from '~/shared/interfaces/schemas/admin.interface'
import { createTokenPair } from '~/utils/auth.util'
import { createKeyAdminActive } from '~/utils/create-key-cache.util'
import { hashPassword, verifyPassword } from '~/utils/crypto.util'
import { verifyToken } from '~/utils/jwt.util'
import TokensService from '../tokens/tokens.service'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { UsersCollection, UsersSchema } from '../users/user.schema'
import usersService from '../users/users.service'

class AdminService {
  //
  async initFirstAdmin() {
    // Implementation for initializing the first admin user
    const existAdmin = await AdminCollection.findOne({ email: envs.ADMIN_EMAIL })
    if (!existAdmin) {
      await AdminCollection.insertOne({
        name: 'Super Admin',
        email: envs.ADMIN_EMAIL || '',
        password: hashPassword(envs.ADMIN_PASSWORD || ''),
        verify: EAuthVerifyStatus.Verified,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        created_at: new Date()
      })
      console.log('First admin user created.')
    } else {
      console.log('Admin user already exists.')
    }
  }

  //
  async login(payload: LoginAuthDto) {
    // Kiểm tra tồn tại email
    const foundAdmin = await this.findOneByEmail(payload?.email)
    if (!foundAdmin) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng.')
    }

    // Kiểm tra mật khẩu đúng hay không
    const verify_pass = verifyPassword(payload.password, foundAdmin.password)
    if (!verify_pass) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng.')
    }

    // Tạo access/refresh token
    const [access_token, refresh_token] = await createTokenPair({
      payload: { user_id: '', admin_id: foundAdmin._id.toString(), role: 'ADMIN' },
      private_access_key: envs.JWT_SECRET_ACCESS_ADMIN,
      private_refresh_key: envs.JWT_SECRET_REFRESH_ADMIN
    })

    // Lưu refresh token vào database
    const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH_ADMIN })
    await TokensService.create({ refresh_token, user_id: foundAdmin._id.toString(), iat, exp })

    return {
      access_token,
      refresh_token
    }
  }

  //
  async findOneByEmail(email: string) {
    return await AdminCollection.findOne(
      { email },
      {
        projection: {
          email: 1,
          password: 1
        }
      }
    )
  }

  //
  async getAdminActive(admin_id: string) {
    const keyCache = createKeyAdminActive(admin_id)
    let adminActive = await cacheService.get<IAdmin>(keyCache)
    if (!adminActive) {
      console.log('❌ cache hết hạn lấy admin hiện tại trong database 🤦‍♂️')
      adminActive = await AdminCollection.findOne(
        { _id: new ObjectId(admin_id) },
        { projection: { email_verify_token: 0, forgot_password_token: 0, password: 0 } }
      )
      await cacheService.set(keyCache, adminActive, 300)
    }

    if (!adminActive) {
      throw new NotFoundError('Admin không tồn tại.')
    }

    return this.signedCloudfrontAvatarUrls(adminActive) as IAdmin
  }

  //
  async adminGetUsers({ admin_id, query }: { admin_id: string; query: IQuery<IUser> }): Promise<ResMultiType<IUser>> {
    //
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<IUser>(query)

    //
    const has_q = {
      query: {}
    }

    if (q) {
      has_q.query = { $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }] }
    }

    //
    const users = await UsersCollection.aggregate<UsersSchema>([
      {
        $match: {
          _id: { $ne: new ObjectId(admin_id) },
          ...has_q.query
        }
      },
      {
        $sort: sort
      },
      {
        $skip: skip
      },
      { $limit: limit },
      {
        $project: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    ]).toArray()

    const total = await UsersCollection.countDocuments({
      _id: { $ne: new ObjectId(admin_id) },
      ...has_q.query
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: usersService.signedCloudfrontAvatarUrls(users) as IUser[]
    }
  }

  //
  signedCloudfrontAvatarUrls = (admin: IAdmin[] | IAdmin | null) => {
    //
    if (!admin) return admin

    //
    if (!Array.isArray(admin))
      return {
        ...admin,
        avatar: admin?.avatar
          ? {
              s3_key: admin.avatar.s3_key,
              ...signedCloudfrontUrl(admin.avatar)
            }
          : null
      }

    //
    return admin.map((a) => ({
      ...a,
      avatar: a?.avatar
        ? {
            s3_key: a.avatar.s3_key,
            ...signedCloudfrontUrl(a.avatar)
          }
        : null
    }))
  }
}

export default new AdminService()
