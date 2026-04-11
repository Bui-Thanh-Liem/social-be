import { envs } from '../../configs/env.config'
import { createKeyAdminActive } from '../../utils/create-key-cache.util'
import { hashPassword } from '../../utils/crypto.util'
import CacheService from '../../helpers/cache.helper'
import { ObjectId } from 'mongodb'
import { NotFoundError } from '../../core/error.response'
import { IAdmin } from '~/interfaces/private/admin.interface'
import { EAdminVerifyStatus } from '~/enums/private/admin.enum'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { AdminCollection, AdminSchema } from '~/models/private/admin.schema'

class AdminService {
  //
  async initFirstAdmin() {
    // Implementation for initializing the first admin user
    const existAdmin = await AdminCollection.findOne({
      email: envs.ADMIN_EMAIL
    })
    if (!existAdmin) {
      await AdminCollection.insertOne(
        new AdminSchema({
          name: 'Super Admin',
          email: envs.ADMIN_EMAIL || '',
          password: hashPassword(envs.ADMIN_PASSWORD || ''),
          verify: EAdminVerifyStatus.Verified,
          two_factor_enabled: false,
          two_factor_secret: null,
          is_root_admin: true,
          created_at: new Date()
        })
      )
      console.log('✅ First admin user created successfully.')
    } else {
      console.log('✅ First admin user already exists. No action needed.')
    }
  }

  //
  async findOneByEmail(email: string) {
    return await AdminCollection.findOne(
      { email },
      {
        projection: {
          email: 1,
          password: 1,
          two_factor_enabled: 1,
          two_factor_session_enabled: 1
        }
      }
    )
  }

  //
  async getAdminActive(admin_id: string) {
    const keyCache = createKeyAdminActive(admin_id)
    let adminActive = await CacheService.get<IAdmin>(keyCache)
    if (!adminActive) {
      console.log('❌ cache hết hạn lấy admin hiện tại trong database 🤦‍♂️')
      adminActive = await AdminCollection.findOne(
        { _id: new ObjectId(admin_id) },
        {
          projection: {
            password: 0,
            two_factor_secret: 0,
            two_factor_backups: 0,
            email_verify_token: 0,
            forgot_password_token: 0
          }
        }
      )
      await CacheService.set(keyCache, adminActive, 300)
    }

    if (!adminActive) {
      throw new NotFoundError('Admin không tồn tại.')
    }

    return this.signedCloudfrontAvatarUrls(adminActive) as IAdmin
  }

  //
  private signedCloudfrontAvatarUrls = (users: IAdmin[] | IAdmin | null) => {
    //
    if (!users) return users

    //
    if (!Array.isArray(users))
      return {
        ...users,
        avatar: users?.avatar
          ? {
              s3_key: users.avatar.s3_key,
              ...signedCloudfrontUrl(users.avatar)
            }
          : null
      }

    //
    return users.map((user) => ({
      ...user,
      avatar: user?.avatar
        ? {
            s3_key: user.avatar.s3_key,
            ...signedCloudfrontUrl(user.avatar)
          }
        : null
    }))
  }
}

export default new AdminService()
