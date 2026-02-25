import { ObjectId } from 'mongodb'
import { generateSecret, generateURI, verify } from 'otplib'
import { toDataURL } from 'qrcode'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { envs } from '~/configs/env.config'
import { BadRequestError, NotFoundError, UnauthorizedError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { IAdmin } from '~/modules/admin/admin.interface'
import { AdminCollection } from '~/modules/admin/admin.schema'
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
  async setupTwoFactorAuth({ admin_id, email }: { admin_id: string; email: string }) {
    // 1. Tạo secret
    const secret = generateSecret()

    // 2. Luu secret vào database của admin hiện tại
    await AdminCollection.updateOne({ _id: new ObjectId(admin_id), email }, { $set: { twoFactorSecret: secret } })

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
    const admin = await AdminCollection.findOne({ _id: new ObjectId(admin_id) }, { projection: { twoFactorSecret: 1 } })
    if (!admin || !admin.twoFactorSecret) {
      throw new NotFoundError('Admin không tồn tại hoặc chưa thiết lập 2FA.')
    }

    // 2. Xác thực token OTP mà admin nhập vào với secret đã lưu
    const isValid = await verify({
      token,
      secret: admin?.twoFactorSecret || ''
    })

    // 3. Nếu xác thực thành công, kích hoạt 2FA cho admin
    if (!isValid.valid) {
      throw new BadRequestError('Mã không hợp lệ.')
    }

    // Kích hoạt 2FA cho admin
    await AdminCollection.updateOne({ _id: new ObjectId(admin_id) }, { $set: { twoFactorEnabled: true } })
    return true
  }

  //
  async loginWithTwoFactorAuth(admin_id: string, token: string) {
    // 1. Nếu 2FA không được kích hoạt thì không cần xác thực nữa
    const admin = await AdminCollection.findOne(
      { _id: new ObjectId(admin_id) },
      { projection: { twoFactorSecret: 1, twoFactorEnabled: 1 } }
    )
    if (!admin || !admin.twoFactorEnabled) {
      throw new NotFoundError('Admin không tồn tại hoặc chưa thiết lập 2FA.')
    }

    // 2. Xác thực token OTP mà admin nhập vào với secret đã lưu
    const isValid = await verify({
      token,
      secret: admin?.twoFactorSecret || ''
    })

    // Nếu xác thực không thành công, trả về lỗi
    if (!isValid.valid) {
      throw new BadRequestError('Mã không hợp lệ.')
    }

    return true
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
}

export default new AdminService()
