import { ObjectId } from 'mongodb'
import { generateSecret, generateURI, verify } from 'otplib'
import { toDataURL } from 'qrcode'
import { LoginAdminDto, ResActive2Fa, ResLoginAdmin, ResVerify2Fa } from '~/shared/dtos/private/auth-admin.dto'
import { EUserTokenType } from '~/shared/enums/public/user-tokens.enum'
import botTelegramService from '~/helpers/bot-telegram.helper'
import { AdminCollection } from '~/models/private/admin.schema'
import { envs } from '../../configs/env.config'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../core/error.response'
import CacheService from '../../helpers/cache.helper'
import { createKeyAdminActive, createKeyAdminAT, createKeySessionLogin } from '../../utils/create-key-cache.util'
import { verifyPassword } from '../../utils/crypto.util'
import { signToken } from '../../utils/jwt.util'
import adminTokensService from './admin-tokens.service'
import adminService from './admins.service'
import { ITwoFactorBackup } from '~/shared/interfaces/private/admin.interface'

class AuthAdminService {
  // Đăng nhập admin trả về thông tin cần setup hay verify
  async login(payload: LoginAdminDto): Promise<{ message: string; data?: ResLoginAdmin }> {
    // Kiểm tra tồn tại email
    const foundAdmin = await adminService.findOneByEmail(payload?.email)
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
        ? 'Đăng nhập thành công, tài khoản của bạn đang được sử dụng ở nơi khác.'
        : 'Vui lòng nhập mã 2FA để tiếp tục'
      : 'Vui lòng thiết lập 2FA để tiếp tục'

    // Sẽ tạo một session làm việc 5p để admin có thể thiết lập hoặc xác thực 2FA, sau 5p sẽ tự động vô hiệu hóa session này và bắt buộc phải đăng nhập lại
    const keySessionLogin = createKeySessionLogin(foundAdmin._id.toString())
    await CacheService.set(keySessionLogin, true, 300)

    return {
      message,
      data: {
        admin_id: foundAdmin._id.toString(),
        two_factor_enabled: foundAdmin.two_factor_enabled,
        two_factor_session_enabled: foundAdmin.two_factor_session_enabled
      }
    }
  }

  // Đăng xuất admin, vô hiệu hóa session 2FA
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
      await CacheService.del(keyCache)
    }
  }

  // Xác thực 2FA lần đầu đăng nhập
  async setupTwoFactorAuth({ admin_id }: { admin_id: string }) {
    // Kiểm tra session login còn hiệu lực hay không
    const keySessionLogin = createKeySessionLogin(admin_id)
    const session = await CacheService.get(keySessionLogin)
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
      issuer: 'devandbug.info.vn'
    })

    // 4. Chuyển URI thành QR code để admin có thể quét
    const qrCodeUrl = await toDataURL(otpAuth)

    // Trả về secret để admin có thể cấu hình trên app 2FA của họ
    return { secret, qrCodeUrl }
  }

  // Xác thực token 2FA để kích hoạt 2FA cho admin
  async activeTwoFactorAuth({ admin_id, token }: { admin_id: string; token: string }): Promise<ResActive2Fa> {
    // Kiểm tra session login còn hiệu lực hay không
    const keySessionLogin = createKeySessionLogin(admin_id)
    const session = await CacheService.get(keySessionLogin)
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
    const backup_secret: ITwoFactorBackup[] = Array.from({ length: 5 }).map((_) => ({
      used: false,
      used_at: new Date(),
      secret: generateSecret()
    }))
    const updated = await AdminCollection.updateOne(
      { _id: new ObjectId(admin_id) },
      { $set: { two_factor_enabled: true, two_factor_backups: backup_secret } }
    )

    // Xóa session login sau khi kích hoạt thành công
    await CacheService.del(keySessionLogin)

    return {
      backup_secret,
      two_factor_enabled: updated.modifiedCount > 0
    }
  }

  // Xác thực token 2FA khi đăng nhập
  async verifyTwoFactorAuth({ token, admin_id }: { admin_id: string; token: string }): Promise<ResVerify2Fa> {
    // Kiểm tra session login còn hiệu lực hay không
    const keySessionLogin = createKeySessionLogin(admin_id)
    const session = await CacheService.get(keySessionLogin)
    if (!session) {
      throw new BadRequestError('Phiên làm việc đã hết, vui lòng đăng nhập lại.')
    }

    // 1. Nếu 2FA không được kích hoạt thì không cần xác thực nữa
    const admin = await AdminCollection.findOne(
      { _id: new ObjectId(admin_id) },
      { projection: { two_factor_secret: 1, two_factor_enabled: 1, email: 1 } }
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

    // Tạo access/refresh token
    const token_ = await signToken({
      expires_in: envs.JWT_EXPIRES_IN_30D,
      private_key: envs.JWT_SECRET_ACCESS_ADMIN,
      payload: { admin_id, user_id: '', type: EUserTokenType.AccessToken, role: 'admin' }
    })

    // Lưu refresh token vào database
    await adminTokensService.create({
      refresh_token: token_,
      admin_id: admin_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 30 // 30 ngày (JWT_EXPIRES_IN_30D)
    })

    // Xóa session login sau khi kích hoạt thành công
    await Promise.all([
      CacheService.del(keySessionLogin),
      CacheService.del(createKeyAdminAT(token_)),
      botTelegramService.sendTelegramAlert({
        message: `<b>Admin ${admin.email} đã đăng nhập thành công vào lúc ${new Date().toLocaleString()}.</b>`
      })
    ])

    return {
      token: token_,
      two_factor_session_enabled: true
    }
  }
}

export default new AuthAdminService()
