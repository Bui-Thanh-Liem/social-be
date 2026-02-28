import { generateSecret, verify, generateURI } from 'otplib'
import { ObjectId } from 'mongodb'
import { toDataURL } from 'qrcode'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { envs } from '~/configs/env.config'
import { BadRequestError, NotFoundError, UnauthorizedError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { IAdmin, ITwoFactorBackup } from '~/modules/admin/admin.interface'
import { AdminCollection, AdminSchema } from '~/modules/admin/admin.schema'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { createTokenPair } from '~/utils/auth.util'
import { createKeyAdminActive } from '~/utils/create-key-cache.util'
import { hashPassword, verifyPassword } from '~/utils/crypto.util'
import { verifyToken } from '~/utils/jwt.util'
import TokensService from '../tokens/tokens.service'
import { LoginAdminDto } from './admin.dto'

class AdminService {
  //
  async initFirstAdmin() {
    // Implementation for initializing the first admin user
    const existAdmin = await AdminCollection.findOne({ email: envs.ADMIN_EMAIL })
    if (!existAdmin) {
      await AdminCollection.insertOne(
        new AdminSchema({
          name: 'Super Admin',
          email: envs.ADMIN_EMAIL || '',
          password: hashPassword(envs.ADMIN_PASSWORD || ''),
          verify: EAuthVerifyStatus.Verified,
          two_factor_enabled: false,
          two_factor_secret: null,
          created_at: new Date()
        })
      )
      console.log('First admin user created.')
    } else {
      console.log('Admin user already exists.')
    }
  }

  //
  async login(payload: LoginAdminDto) {
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

    //
    if (!foundAdmin.two_factor_session_enabled) {
      return { admin_id: foundAdmin._id, two_factor_session_enabled: foundAdmin.two_factor_session_enabled }
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
      refresh_token,
      admin_id: foundAdmin._id,
      two_factor_session_enabled: foundAdmin.two_factor_session_enabled
    }
  }

  //
  async setupTwoFactorAuth({ admin_id, email }: { admin_id: string; email: string }) {
    const admin = await AdminCollection.findOne(
      { _id: new ObjectId(admin_id) },
      { projection: { two_factor_enabled: 1 } }
    )
    if (admin?.two_factor_enabled) {
      throw new BadRequestError('Bạn đã bật 2fa rồi, vui lòng liên hệ quản trị viên.')
    }

    // 1. Tạo secret
    const secret = generateSecret()

    // 2. Luu secret vào database của admin hiện tại
    await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id), email },
      { $set: { two_factor_secret: secret, two_factor_enabled: false } }
    )

    // 3. Tạo URI
    const otpAuth = generateURI({
      secret,
      period: 30, // thời gian hiệu lực của mã OTP (mặc định là 30 giây)
      label: email,
      issuer: 'admin.devandbug.info.vn'
    })

    // 4. Chuyển URI thành QR code để admin có thể quét
    const qrCodeUrl = await toDataURL(otpAuth)

    // Trả về secret để admin có thể cấu hình trên app 2FA của họ
    return { secret, qrCodeUrl }
  }

  //
  async activeTwoFactorAuth({ admin_id, token }: { admin_id: string; token: string }) {
    // 1. Lấy secret từ database
    const admin = await AdminCollection.findOne(
      { _id: new ObjectId(admin_id) },
      { projection: { two_factor_secret: 1 } }
    )
    if (!admin || !admin.two_factor_secret) {
      throw new NotFoundError('Admin không tồn tại hoặc chưa thiết lập 2FA.')
    }

    // 2. Xác thực token OTP mà admin nhập vào với secret đã lưus
    const { valid } = await verify({
      token,
      secret: admin?.two_factor_secret || ''
    })

    // 3. Nếu xác thực thành công, kích hoạt 2FA cho admin
    if (!valid) {
      throw new BadRequestError('Mã không hợp lệ.')
    }

    // Kích hoạt 2FA cho admin
    const backupSecret: ITwoFactorBackup[] = Array.from({ length: 5 }).map((_) => ({
      secret: generateSecret(),
      used: false,
      used_at: new Date()
    }))
    await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      { $set: { two_factor_enabled: true, two_factor_backups: backupSecret, two_factor_session_enabled: true } }
    )
    return true
  }

  //
  async loginWithTwoFactorAuth({ token, admin_id }: { admin_id: string; token: string }) {
    // 1. Nếu 2FA không được kích hoạt thì không cần xác thực nữa
    const admin = await AdminCollection.findOne(
      { _id: new ObjectId(admin_id) },
      { projection: { two_factor_secret: 1, two_factor_enabled: 1 } }
    )
    if (!admin || !admin.two_factor_enabled || !admin.two_factor_secret) {
      throw new NotFoundError('Admin không tồn tại hoặc chưa thiết lập 2FA.')
    }

    // 2. Xác thực token OTP mà admin nhập vào với secret đã lưu
    const { valid } = await verify({
      token,
      secret: admin?.two_factor_secret || ''
    })

    // Nếu xác thực không thành công, trả về lỗi
    if (!valid) {
      throw new BadRequestError('Mã không hợp lệ.')
    }

    //
    await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      {
        $set: {
          two_factor_session_enabled: true
        }
      }
    )

    return true
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
    let adminActive = await cacheService.get<IAdmin>(keyCache)
    if (!adminActive) {
      console.log('❌ cache hết hạn lấy admin hiện tại trong database 🤦‍♂️')
      adminActive = await AdminCollection.findOne(
        { _id: new ObjectId(admin_id) },
        { projection: { email_verify_token: 0, forgot_password_token: 0, password: 0, twoFactorSecret: 0 } }
      )
      await cacheService.set(keyCache, adminActive, 300)
    }

    if (!adminActive) {
      throw new NotFoundError('Admin không tồn tại.')
    }

    return this.signedCloudfrontAvatarUrls(adminActive) as IAdmin
  }

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

  async logout({ admin_id }: { admin_id: string }) {
    const updated = await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      {
        $set: {
          two_factor_session_enabled: false
        }
      }
    )

    if (updated.modifiedCount) {
      const keyCache = createKeyAdminActive(admin_id)
      await cacheService.del(keyCache)
    }
  }
}

export default new AdminService()
