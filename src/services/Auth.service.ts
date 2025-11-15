import axios from 'axios'
import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { StringValue } from 'ms'
import { emailQueue, notificationQueue } from '~/bull/queues'
import { envs } from '~/configs/env.config'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '~/core/error.reponse'
import cacheServiceInstance from '~/helpers/cache.helper'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import { CONSTANT_JOB, CONSTANT_USER } from '~/shared/constants'
import {
  ForgotPasswordDto,
  LoginUserDto,
  RegisterUserDto,
  ResetPasswordDto,
  UpdateMeDto
} from '~/shared/dtos/req/auth.dto'
import { ENotificationType, ETokenType } from '~/shared/enums/type.enum'
import { ISendVerifyEmail } from '~/shared/interfaces/common/mail.interface'
import { IGoogleToken, IGoogleUserProfile } from '~/shared/interfaces/common/oauth-google.interface'
import { createTokenPair } from '~/utils/auth.util'
import { generatePassword, hashPassword, verifyPassword } from '~/utils/crypto.util'
import { signToken, verifyToken } from '~/utils/jwt.util'
import RefreshTokenService from './Refresh-token.service'
import UsersService from './Users.service'

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
    const email_verify_token = await signToken({
      payload: { user_id: '', type: ETokenType.VerifyToken },
      privateKey: envs.JWT_SECRET_TEMP,
      options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
    })

    // Mã hoá mật khẩu và chuyển đổi định dạng username user_name
    const password_hashed = hashPassword(payload.password)
    const snake_case_name = `@${_.snakeCase(payload.name)}`.slice(0, 20)

    // Lưu user vào database
    const result = await UserCollection.insertOne(
      new UserSchema({
        ...payload,
        email_verify_token,
        username: snake_case_name,
        password: password_hashed,
        day_of_birth: new Date(payload.day_of_birth)
      })
    )

    // Tạo token/refresh
    const [access_token, refresh_token] = await createTokenPair({
      payload: {
        user_id: result.insertedId.toString()
      }
    })

    //
    if (!access_token || !refresh_token) {
      throw new BadRequestError('Có lỗi trong quá trình đăng ký vui lòng thử lại.')
    }

    // Khi đăng kí thành công thì cho người dùng đăng nhập vào ứng dụng ngay.
    const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
    await RefreshTokenService.create({ refresh_token, user_id: result.insertedId.toString(), iat, exp })

    // Đưa qua worker gửi mail
    await emailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
      to_email: payload.email,
      name: payload.name,
      url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
    } as ISendVerifyEmail)

    // Gửi thông báo xác thực email
    await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
      content: 'Kiểm tra mail để xác thực tài khoản, nếu bạn đã xác thực vui lòng bỏ qua thông báo này.',
      receiver: result.insertedId.toString(),
      sender: result.insertedId.toString(),
      type: ENotificationType.Other
    })

    //
    return {
      access_token,
      refresh_token
    }
  }

  async login(payload: LoginUserDto) {
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
      payload: { user_id: foundUser._id.toString() }
    })

    // Lưu refresh token vào database
    const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
    await RefreshTokenService.create({ refresh_token, user_id: foundUser._id.toString(), iat, exp })

    return {
      access_token,
      refresh_token
    }
  }

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
        payload: { user_id: exist._id.toString() }
      })

      const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
      await RefreshTokenService.create({ refresh_token, user_id: exist._id.toString(), exp, iat })

      return {
        access_token,
        refresh_token,
        status: 'Login'
      }
    }

    //
    const newPass = generatePassword()
    const register = await this.signup({
      email: user_info.email,
      name: user_info.name,
      day_of_birth: new Date(),
      confirm_password: newPass,
      password: newPass,
      avatar: user_info.picture
    })

    return {
      ...register,
      status: 'Register'
    }
  }

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
        payload: { user_id: exist._id.toString() }
      })

      const { iat, exp } = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
      await RefreshTokenService.create({ refresh_token, user_id: exist._id.toString(), exp, iat })

      return {
        access_token,
        refresh_token,
        status: 'Login'
      }
    }

    //
    const newPass = generatePassword()
    const register = await this.signup({
      email: user_info.email,
      name: user_info.name,
      day_of_birth: new Date(),
      confirm_password: newPass,
      password: newPass,
      avatar: user_info.picture
    })

    return {
      ...register,
      status: 'Register'
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

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    })

    return data
  }

  // Từ access_token lấy thông tin user google
  private async getOauthGoogleInfoUser(access_token: string, id_token: string): Promise<IGoogleUserProfile> {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
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
        url: 'https://graph.facebook.com/v21.0/oauth/access_token',
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
    const res = await axios.get('https://graph.facebook.com/me', {
      params: {
        access_token: token,
        fields: 'id,name,email'
      }
    })

    return res.data
  }

  async logout({ refresh_token, user_id }: { refresh_token: string; user_id: string }) {
    const key_cache = `${CONSTANT_USER.user_active_key_cache}-${user_id}`
    await cacheServiceInstance.del(key_cache)
    return await RefreshTokenService.deleteByToken({ token: refresh_token })
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    //
    const user = await UserCollection.findOne({ email })
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }

    //
    const forgot_password_token = await signToken({
      payload: { user_id: user._id.toString(), type: ETokenType.ForgotPasswordToken },
      privateKey: envs.JWT_SECRET_TEMP,
      options: { expiresIn: envs.TEMP_TOKEN_EXPIRES_IN as StringValue }
    })

    //
    await UserCollection.updateOne(
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

  async resetPassword(objectId: ObjectId, payload: ResetPasswordDto) {
    //
    const password_hashed = hashPassword(payload.password)

    await UsersService.resetUserActive(objectId.toString())

    //
    return await UserCollection.updateOne(
      { _: objectId },
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

  async refreshToken({ user_id, exp }: { user_id: string; exp?: number }) {
    const [access_token, refresh_token] = await createTokenPair({
      payload: { user_id },
      exp_refresh: exp
    })

    const decoded = await verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH })
    await Promise.all([RefreshTokenService.create({ refresh_token, user_id, iat: decoded.iat, exp: decoded.exp })])

    return { access_token, refresh_token }
  }

  private async checkExistByName(name: string) {
    const snake_case_name = `@${_.snakeCase(name)}`.slice(0, 20)
    console.log('snake_case_name::', snake_case_name)

    return (await UserCollection.countDocuments({ $or: [{ name }, { username: snake_case_name }] })) > 0
  };

  async updateMe(user_id: string, payload: UpdateMeDto) {
    const user = await UserCollection.findOne({ username: payload.username, _id: { $ne: new ObjectId(user_id) } })
    if (user) {
      throw new ConflictError('Tên người dùng đã tồn tại.')
    }

    await UsersService.resetUserActive(user_id)

    return await UserCollection.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...payload
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
