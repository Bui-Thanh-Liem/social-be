import axios from 'axios'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { StringValue } from 'ms'
import { emailQueue, notificationQueue } from '~/infra/queues'
import { envs } from '~/configs/env.config'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { CONSTANT_JOB } from '~/shared/constants'
import { EAuthVerifyStatus } from '~/shared/enums/status.enum'
import { ENotificationType, ETokenType } from '~/shared/enums/type.enum'
import { ISendVerifyEmail } from '~/shared/interfaces/common/mail.interface'
import { IGoogleToken, IGoogleUserProfile } from '~/shared/interfaces/common/oauth-google.interface'
import { createTokenPair } from '~/utils/auth.util'
import { generatePassword, hashPassword, verifyPassword } from '~/utils/crypto.util'
import { signToken, verifyToken } from '~/utils/jwt.util'
import { logger } from '~/utils/logger.util'
import { createKeyUserActive } from '~/utils/create-key-cache.util'
import UsersService from '../users/users.service'
import TokensService from '../tokens/tokens.service'
import { UsersCollection, UsersSchema } from '../users/users.schema'
import { ForgotPasswordDto, LoginAuthDto, RegisterUserDto, ResetPasswordDto, UpdateMeDto } from './auth.dto'
import BadWordsService from '../bad-words/bad-words.service'

class AuthService {
  async signup(payload: RegisterUserDto) {
    //
    const [holder_email_user, holder_name_user] = await Promise.all([
      UsersService.findOneByEmail(payload.email),
      this.checkExistByName(payload?.name)
    ])

    // Kiểm tra email tồn tại hay chưa
    if (holder_email_user) {
      throw new ConflictError('Email đã tồn tại.')
    }

    // // Kiểm tra name tồn tại hay chưa
    if (holder_name_user) {
      throw new ConflictError('Tên người dùng đã tồn tại.')
    }

    // Tạo token để verify email
    let email_verify_token = ''
    if (!payload.verify) {
      email_verify_token = await signToken({
        payload: { user_id: '', type: ETokenType.VerifyToken, role: 'USER', admin_id: '' },
        privateKey: envs.JWT_SECRET_TEMP,
        options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
      })
    }

    // Mã hoá mật khẩu và chuyển đổi định dạng username user_name
    const password_hashed = hashPassword(payload.password)
    const snake_case_name = `@${_.snakeCase(payload.name)}`.slice(0, 20)

    // Lưu user vào database
    const newUser = await UsersCollection.insertOne(
      new UsersSchema({
        ...payload,
        email_verify_token,
        username: snake_case_name,
        password: password_hashed,
        day_of_birth: new Date(payload.day_of_birth),
        verify: payload.verify || EAuthVerifyStatus.Unverified
      })
    )

    // Tạo token/refresh
    const [access_token, refresh_token] = await createTokenPair({
      payload: {
        user_id: newUser.insertedId.toString(),
        admin_id: '',
        role: 'USER'
      },
      private_access_key: envs.JWT_SECRET_ACCESS,
      private_refresh_key: envs.JWT_SECRET_REFRESH
    })

    //
    if (!access_token || !refresh_token) {
      throw new BadRequestError('Có lỗi trong quá trình đăng ký vui lòng thử lại.')
    }

    // Khi đăng kí thành công thì cho người dùng đăng nhập vào ứng dụng ngay.
    const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
    await TokensService.create({ refresh_token, user_id: newUser.insertedId.toString(), iat, exp })

    // Gửi thông báo xác thực email
    if (payload.verify !== EAuthVerifyStatus.Verified) {
      // Gửi email xác thực
      await emailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
        to_email: payload.email,
        name: payload.name,
        url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
      } as ISendVerifyEmail)

      // Tạo thông báo trong hệ thống
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: 'Kiểm tra mail để xác thực tài khoản, nếu bạn đã xác thực vui lòng bỏ qua thông báo này.',
        receiver: newUser.insertedId.toString(),
        sender: newUser.insertedId.toString(),
        type: ENotificationType.Other
      })
    }

    //
    return {
      access_token,
      refresh_token
    }
  }

  //
  async login(payload: LoginAuthDto) {
    // Kiểm tra tồn tại email
    const foundUser = await UsersService.findOneByEmail(payload?.email)
    if (!foundUser) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng.')
    }

    // Kiểm tra mật khẩu đúng hay không
    const verify_pass = verifyPassword(payload.password, foundUser.password)
    if (!verify_pass) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng.')
    }

    // Tạo access/refresh token
    const [access_token, refresh_token] = await createTokenPair({
      payload: { user_id: foundUser._id.toString(), role: 'USER', admin_id: '' },
      private_access_key: envs.JWT_SECRET_ACCESS,
      private_refresh_key: envs.JWT_SECRET_REFRESH
    })

    // Lưu refresh token vào database
    const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
    await TokensService.create({ refresh_token, user_id: foundUser._id.toString(), iat, exp })

    return {
      access_token,
      refresh_token
    }
  }

  //
  async googleLogin(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const user_info = await this.getOauthGoogleInfoUser(access_token, id_token)

    //
    if (!user_info.verified_email) {
      throw new BadRequestError('Email của bạn chưa được xác minh từ google.')
    }

    //
    const exist = await UsersService.findOneByEmail(user_info?.email)

    // Nếu đã đăng nhập rồi thì tạo token gửi về client
    if (exist) {
      const [access_token, refresh_token] = await createTokenPair({
        payload: { user_id: exist._id.toString(), role: 'USER', admin_id: '' },
        private_access_key: envs.JWT_SECRET_ACCESS,
        private_refresh_key: envs.JWT_SECRET_REFRESH
      })

      const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
      await TokensService.create({ refresh_token, user_id: exist._id.toString(), exp, iat })

      return {
        access_token,
        refresh_token,
        status: 'login'
      }
    }

    //
    const newPass = generatePassword()
    const register = await this.signup({
      password: newPass,
      name: user_info.name,
      email: user_info.email,
      day_of_birth: new Date(),
      confirm_password: newPass,
      avatar: {
        s3_key: '',
        url: user_info.picture
      },
      verify: EAuthVerifyStatus.Verified
    })

    return {
      ...register,
      status: 'signup'
    }
  }

  //
  async facebookLogin(code: string) {
    const { access_token } = await this.getOauthFacebookToken(code)
    const user_info = await this.getOauthFacebookInfoUser(access_token)

    //
    if (!user_info.verified_email) {
      throw new BadRequestError('Email của bạn chưa được xác minh từ facebook.')
    }

    //
    const exist = await UsersService.findOneByEmail(user_info?.email)

    // Nếu đã đăng nhập rồi thì tạo token gửi về client
    if (exist) {
      const [access_token, refresh_token] = await createTokenPair({
        payload: { user_id: exist._id.toString(), role: 'USER', admin_id: '' },
        private_access_key: envs.JWT_SECRET_ACCESS,
        private_refresh_key: envs.JWT_SECRET_REFRESH
      })

      const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
      await TokensService.create({ refresh_token, user_id: exist._id.toString(), exp, iat })

      return {
        access_token,
        refresh_token,
        status: 'login'
      }
    }

    //
    const newPass = generatePassword()
    const register = await this.signup({
      password: newPass,
      name: user_info.name,
      email: user_info.email,
      day_of_birth: new Date(),
      confirm_password: newPass,
      avatar: user_info.picture,
      verify: EAuthVerifyStatus.Verified
    })

    return {
      ...register,
      status: 'signup'
    }
  }

  // Đổi code lấy access_token từ google
  private async getOauthGoogleToken(code: string): Promise<IGoogleToken> {
    const body = {
      code,
      client_id: envs.GOOGLE_CLIENT_ID,
      client_secret: envs.GOOGLE_CLIENT_SECRET,
      redirect_uri: envs.GOOGLE_REDIRECT_URIS,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post(envs.GOOGLE_URL_GET_CODE, body, {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    })

    return data
  }

  // Từ access_token lấy thông tin user google
  private async getOauthGoogleInfoUser(access_token: string, id_token: string): Promise<IGoogleUserProfile> {
    const { data } = await axios.get(envs.GOOGLE_URL_GET_INFO, {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data
  }

  // Đổi code lấy access_token từ facebook
  private async getOauthFacebookToken(code: string): Promise<{ access_token: string }> {
    const fb_client_id = envs.FACEBOOK_CLIENT_ID
    const fb_redirect_uri = envs.FACEBOOK_REDIRECT_URIS
    const fe_client_secret = envs.FACEBOOK_CLIENT_SECRET

    // Kiểm tra các giá trị bắt buộc
    if (!fb_client_id || !fb_redirect_uri || !fe_client_secret || !code) {
      throw new NotFoundError('Thiếu các tham số bắt buộc để trao đổi mã thông báo Facebook.')
    }

    try {
      const response = await axios({
        method: 'post',
        url: envs.FACEBOOK_URL_GET_CODE,
        data: {
          // Sử dụng data cho POST
          client_id: fb_client_id,
          redirect_uri: fb_redirect_uri,
          client_secret: fe_client_secret,
          code
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { access_token, expires_in } = response.data
      if (!access_token) {
        throw new NotFoundError('Không tìm thấy mã thông báo truy cập trong phản hồi.')
      }

      console.log(`Access token retrieved, expires in ${expires_in} seconds`)
      return { access_token }
    } catch (error) {
      throw new BadRequestError(
        `Không thể đổi mã để lấy mã thông báo truy cập: ${(error as { message: string })?.message}`
      )
    }
  }

  // Từ access_token lấy thông tin user facebook
  private async getOauthFacebookInfoUser(token: string) {
    const res = await axios.get(envs.FACEBOOK_URL_GET_INFO, {
      params: {
        access_token: token,
        fields: 'id,name,email'
      }
    })

    return res.data
  }

  //
  async logout({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    // Xoá Người dùng đang active trong cache
    const key_cache = createKeyUserActive(user_id)
    await cacheService.del(key_cache)

    //
    return await TokensService.deleteByToken({ refresh_token }) // Chỉ đăng xuất trên phiên hiện tại
  }

  //
  async forgotPassword({ email }: ForgotPasswordDto) {
    //
    const user = await UsersCollection.findOne({ email })
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }

    //
    const forgot_password_token = await signToken({
      payload: { user_id: user._id.toString(), type: ETokenType.ForgotPasswordToken, role: 'USER', admin_id: '' },
      privateKey: envs.JWT_SECRET_TEMP,
      options: { expiresIn: envs.TEMP_TOKEN_EXPIRES_IN as StringValue }
    })

    //
    await UsersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    //
    await emailQueue.add(CONSTANT_JOB.FORGOT_PASSWORD, {
      to_email: user?.email,
      name: user?.name,
      url: `${envs.CLIENT_DOMAIN}#reset-password?token=${forgot_password_token}`
    })

    await UsersService.resetUserActive(user._id.toString())

    return true
  }

  //
  async resetPassword(objectId: ObjectId, payload: ResetPasswordDto) {
    //
    const password_hashed = hashPassword(payload.password)

    await UsersService.resetUserActive(objectId.toString())

    //
    return await UsersCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          password: password_hashed,
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  // Đã kiểm tra refresh_token hợp lệ ở route (nếu không hợp lệ thì không cho vào controller)
  async refreshToken({ refresh_token }: { refresh_token: string }) {
    // Kiểm tra xem refresh_token này đã sử dụng chưa
    const foundToken = await TokensService.findByRefreshTokenUsed({ refresh_token })

    // Nếu có (hacker sử dụng rồi hoặc là chính chủ sử dụng rồi giờ hacker sử dụng lại)
    if (foundToken) {
      const decoded = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
      logger.error('Người dùng này đang sử dụng refresh_token đã được sử dụng rồi:::', decoded.user_id)

      // Xoá mọi phiên đang đăng nhập của người dùng này (an toàn nhất)
      await TokensService.deleteByUserId({ user_id: decoded.user_id })
      throw new ForbiddenError('Có lỗi trong quá trình xử lý, vui lòng đăng nhập lại')
    }

    // Kiểm tra refresh_token có trong trạng thái sử dụng hay không
    const holderToken = await TokensService.findByRefreshToken({ refresh_token })
    if (!holderToken) {
      throw new UnauthorizedError()
    }

    // Verify
    const decoded = await verifyToken({ token: holderToken.refresh_token, privateKey: envs.JWT_SECRET_REFRESH })

    // Kiểm tra tồn tại người dùng
    const foundUser = await UsersService.findOneById(decoded.user_id)
    if (!foundUser) throw new NotFoundError('Người dùng không tồn tại.')

    // Tạo access/refresh token mới
    const [access_token, new_refresh_token] = await createTokenPair({
      payload: { user_id: decoded.user_id, role: 'USER', admin_id: '' },
      exp_refresh: decoded.exp,
      private_access_key: envs.JWT_SECRET_ACCESS,
      private_refresh_key: envs.JWT_SECRET_REFRESH
    })

    // Cập nhật lại token đang sử dụng và token đã được sử dụng.
    await TokensService.updateTokenUsed({ new_token: new_refresh_token, token_used: refresh_token })

    //
    return { access_token, refresh_token: new_refresh_token }
  }

  //
  private async checkExistByName(name: string) {
    const snake_case_name = `@${_.snakeCase(name)}`.slice(0, 20)
    console.log('snake_case_name::', snake_case_name)

    return (await UsersCollection.countDocuments({ $or: [{ name }, { username: snake_case_name }] })) > 0
  }

  //
  async updateMeUser(user_id: string, payload: UpdateMeDto) {
    const user = await UsersCollection.findOne({ username: payload.username, _id: { $ne: new ObjectId(user_id) } })
    if (user) {
      throw new ConflictError('Tên người dùng đã tồn tại.')
    }

    //
    await UsersService.resetUserActive(user_id)

    // Lọc từ cấm trong bio, name, username
    const _bio = await BadWordsService.replaceBadWordsInText(payload.bio || '', user_id)
    const _name = await BadWordsService.replaceBadWordsInText(payload.name || '', user_id)
    const _username = await BadWordsService.replaceBadWordsInText(payload.username || '', user_id)

    //
    return await UsersCollection.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...payload,
          bio: _bio,
          name: _name,
          username: _username
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
  }
}

export default new AuthService()
