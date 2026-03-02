import { ObjectId } from 'mongodb'
import { generateSecret, generateURI, verify } from 'otplib'
import { toDataURL } from 'qrcode'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { envs } from '~/configs/env.config'
import { BadRequestError, NotFoundError, UnauthorizedError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { IAdmin, ITwoFactorBackup } from '~/modules/admin/admin.interface'
import { AdminCollection, AdminSchema } from '~/modules/admin/admin.schema'
import { ResActive2Fa, ResLoginAdmin, ResVerify2Fa } from '~/shared/dtos/res/admin.dto'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { createTokenPair } from '~/utils/auth.util'
import { createKeyAdminActive, createKeySessionLogin } from '~/utils/create-key-cache.util'
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
      console.log('✅ First admin user created successfully.')
    } else {
      console.log('✅ First admin user already exists. No action needed.')
    }
  }

  // Đăng nhập admin trả về thông tin cần setup hay verify
  async login(payload: LoginAdminDto): Promise<{ message: string; data?: ResLoginAdmin }> {
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

    // Kiểm tra 2FA
    const message = foundAdmin.two_factor_enabled
      ? foundAdmin.two_factor_session_enabled
        ? 'Đăng nhập thành công'
        : 'Vui lòng nhập mã 2FA để tiếp tục'
      : 'Vui lòng thiết lập 2FA để tiếp tục'

    // Sẽ tạo một session làm việc 5p để admin có thể thiết lập hoặc xác thực 2FA, sau 5p sẽ tự động vô hiệu hóa session này và bắt buộc phải đăng nhập lại
    const keySessionLogin = createKeySessionLogin(foundAdmin._id.toString())
    await cacheService.set(keySessionLogin, true, 300)

    return {
      message,
      data: {
        admin_id: foundAdmin._id.toString(),
        two_factor_enabled: foundAdmin.two_factor_enabled,
        two_factor_session_enabled: foundAdmin.two_factor_session_enabled
      }
    }
  }

  //
  async setupTwoFactorAuth({ admin_id }: { admin_id: string }) {
    // Kiểm tra session login còn hiệu lực hay không
    const keySessionLogin = createKeySessionLogin(admin_id)
    const session = await cacheService.get(keySessionLogin)
    if (!session) {
      throw new BadRequestError('Phiên làm việc đã hết, vui lòng đăng nhập lại để thiết lập 2FA.')
    }

    const admin = await AdminCollection.findOne(
      { _id: new ObjectId(admin_id) },
      { projection: { two_factor_enabled: 1, email: 1 } }
    )
    if (admin?.two_factor_enabled) {
      throw new BadRequestError('Bạn đã bật 2fa rồi, vui lòng liên hệ quản trị viên.')
    }

    // 1. Tạo secret
    const secret = generateSecret()

    // 2. Luu secret vào database của admin hiện tại
    await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      { $set: { two_factor_secret: secret, two_factor_enabled: false } }
    )

    // 3. Tạo URI
    const otpAuth = generateURI({
      secret,
      period: 30, // thời gian hiệu lực của mã OTP (mặc định là 30 giây)
      label: admin?.email || 'Admin',
      issuer: 'admin.devandbug.info.vn'
    })

    // 4. Chuyển URI thành QR code để admin có thể quét
    const qrCodeUrl = await toDataURL(otpAuth)

    // Trả về secret để admin có thể cấu hình trên app 2FA của họ
    return { secret, qrCodeUrl }
  }

  //
  async activeTwoFactorAuth({ admin_id, token }: { admin_id: string; token: string }): Promise<ResActive2Fa> {
    // Kiểm tra session login còn hiệu lực hay không
    const keySessionLogin = createKeySessionLogin(admin_id)
    const session = await cacheService.get(keySessionLogin)
    if (!session) {
      throw new BadRequestError('Phiên làm việc đã hết, vui lòng đăng nhập lại để thiết lập 2FA.')
    }

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
      used: false,
      used_at: new Date(),
      secret: generateSecret()
    }))
    const updated = await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      { $set: { two_factor_enabled: true, two_factor_backups: backupSecret } }
    )

    // Xóa session login sau khi kích hoạt thành công
    await cacheService.del(keySessionLogin)

    return {
      backupSecret,
      two_factor_enabled: updated.modifiedCount > 0
    }
  }

  //
  async verifyTwoFactorAuth({ token, admin_id }: { admin_id: string; token: string }): Promise<ResVerify2Fa> {
    // Kiểm tra session login còn hiệu lực hay không
    const keySessionLogin = createKeySessionLogin(admin_id)
    const session = await cacheService.get(keySessionLogin)
    if (!session) {
      throw new BadRequestError('Phiên làm việc đã hết, vui lòng đăng nhập lại.')
    }

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
    const updated = await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      {
        $set: {
          two_factor_session_enabled: true
        }
      }
    )

    // Tạo access/refresh token
    const [access_token, refresh_token] = await createTokenPair({
      payload: { user_id: '', admin_id: admin._id.toString(), role: 'ADMIN' },
      private_access_key: envs.JWT_SECRET_ACCESS_ADMIN,
      private_refresh_key: envs.JWT_SECRET_REFRESH_ADMIN
    })

    // Lưu refresh token vào database
    const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH_ADMIN })
    await TokensService.create({ refresh_token, user_id: admin._id.toString(), iat, exp })

    // Xóa session login sau khi kích hoạt thành công
    await cacheService.del(keySessionLogin)

    return {
      access_token,
      refresh_token,
      two_factor_session_enabled: updated.modifiedCount > 0
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
    let adminActive = await cacheService.get<IAdmin>(keyCache)
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
      await cacheService.set(keyCache, adminActive, 300)
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

  //
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
