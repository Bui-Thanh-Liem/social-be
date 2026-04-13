import { envs } from '../../configs/env.config'
import { createKeyAdminActive } from '../../utils/create-key-cache.util'
import { hashPassword } from '../../utils/crypto.util'
import CacheService from '../../helpers/cache.helper'
import { ObjectId } from 'mongodb'
import { NotFoundError } from '../../core/error.response'
import { EAdminVerifyStatus } from '~/shared/enums/private/admins.enum'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { AdminCollection, AdminSchema } from '~/models/private/admin.schema'
import { IAdmin } from '~/shared/interfaces/private/admin.interface'

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
          is_root_admin: true,
          created_at: new Date(),
          two_factor_secret: null,
          two_factor_enabled: false,
          email: envs.ADMIN_EMAIL || '',
          verify: EAdminVerifyStatus.Verified,
          password: hashPassword(envs.ADMIN_PASSWORD || '')
        })
      )
      console.log('✅ Tạo tài khoản admin đầu tiên thành công.')
    } else {
      console.log('✅ Tài khoản admin đầu tiên đã tồn tại.')
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
      throw new NotFoundError('Quản trị viên không tồn tại.')
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
