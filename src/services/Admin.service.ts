import { ObjectId } from 'mongodb'
import { envs } from '~/configs/env.config'
import { NotFoundError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { signedCloudfrontUrl } from '~/libs/cloudfront.lib'
import { AdminCollection } from '~/models/schemas/Admin.schema'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { IAdmin } from '~/shared/interfaces/schemas/admin.interface'
import { createKeyAdminActive } from '~/utils/create-key-cache.util'
import { hashPassword } from '~/utils/crypto.util'

class AdminService {
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
