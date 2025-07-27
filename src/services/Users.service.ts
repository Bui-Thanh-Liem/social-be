import axios from 'axios'
import { ObjectId } from 'mongodb'
import { StringValue } from 'ms'
import { envs } from '~/configs/env.config'
import { CONSTANT_JOB, CONSTANT_USER } from '~/constants'
import { LoginUserDto, RegisterUserDto } from '~/dtos/requests/auth.dto'
import { ForgotPasswordDto, ResetPasswordDto, UpdateMeDto } from '~/dtos/requests/user.dto'
import cacheServiceInstance from '~/helpers/cache.helper'
import { sendEmailQueue } from '~/libs/bull/queues'
import { RefreshTokenCollection, RefreshTokenSchema } from '~/models/schemas/RefreshToken.schema'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '~/shared/classes/error.class'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { TokenType } from '~/shared/enums/type.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { IGoogleToken, IGoogleUserProfile } from '~/shared/interfaces/common/oauth-google.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { generatePassword, hashPassword, verifyPassword } from '~/utils/crypto.util'
import { signToken, verifyToken } from '~/utils/jwt.util'

class UsersService {
  async register(payload: RegisterUserDto) {
    //
    const existEmail = await this.findOneByEmail(payload.email)
    if (existEmail) {
      throw new ConflictError('Email already exists')
    }

    //
    const passwordHashed = hashPassword(payload.password)

    //
    const email_verify_token = await signToken({
      payload: { user_id: '', type: TokenType.verifyToken },
      privateKey: envs.JWT_SECRET_TEMP,
      options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
    })

    //
    const result = await UserCollection.insertOne(
      new UserSchema({
        ...payload,
        password: passwordHashed,
        day_of_birth: new Date(payload.day_of_birth),
        email_verify_token
      })
    )

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      payload: {
        user_id: result.insertedId.toString()
      }
    })
    // Khi đăng kí thành công thì cho người dùng đăng nhập luôn
    const { iat, exp } = await this.verifyToken(refresh_token, envs.JWT_SECRET_REFRESH)
    await RefreshTokenCollection.insertOne(
      new RefreshTokenSchema({ token: refresh_token, user_id: result.insertedId, iat, exp })
    )

    //
    await sendEmailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
      toEmail: payload.email,
      name: payload.name,
      url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
    })

    //
    return {
      access_token,
      refresh_token
    }
  }

  async login(payload: LoginUserDto) {
    //
    const exist = await this.findOneByEmail(payload?.email)
    if (!exist) {
      throw new UnauthorizedError('Email or password not correct')
    }

    //
    const verifyPass = verifyPassword(payload.password, exist.password)
    if (!verifyPass) {
      throw new UnauthorizedError('Email or password not correct')
    }

    //
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      payload: { user_id: exist._id.toString() }
    })
    // await RefreshTokenCollection.deleteOne({ user_id: exist._id }) // => Đăng nhập 1 thiết bị
    const { iat, exp } = await this.verifyToken(refresh_token, envs.JWT_SECRET_REFRESH)
    await RefreshTokenCollection.insertOne(
      new RefreshTokenSchema({ token: refresh_token, user_id: exist._id, iat, exp })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async googleLogin(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getOauthGoogleInfoUser(access_token, id_token)

    //
    if (!userInfo.verified_email) {
      throw new BadRequestError('Email not verified')
    }

    //
    const exist = await this.findOneByEmail(userInfo?.email)
    if (exist) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        payload: { user_id: exist._id.toString() }
      })
      // await RefreshTokenCollection.deleteOne({ user_id: exist._id }) // => Đăng nhập 1 thiết bị
      const { iat, exp } = await this.verifyToken(refresh_token, envs.JWT_SECRET_REFRESH)
      await RefreshTokenCollection.insertOne(
        new RefreshTokenSchema({ token: refresh_token, user_id: exist._id, exp, iat })
      )

      return {
        access_token,
        refresh_token,
        status: 'Login'
      }
    }

    //
    const newPass = generatePassword()
    const register = await this.register({
      email: userInfo.email,
      name: userInfo.name,
      day_of_birth: new Date(),
      confirm_password: newPass,
      password: newPass
    })

    return {
      ...register,
      status: 'Register'
    }
  }

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

  async logout(refresh_token: string) {
    return await RefreshTokenCollection.deleteOne({ token: refresh_token })
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    //
    const user = await UserCollection.findOne({ email })
    if (!user) {
      throw new NotFoundError('User not exist')
    }

    //
    const forgot_password_token = await signToken({
      payload: { user_id: user._id.toString(), type: TokenType.forgotPasswordToken },
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
    await sendEmailQueue.add(CONSTANT_JOB.FORGOT_PASSWORD, {
      toEmail: user?.email,
      name: user?.name,
      url: `${envs.CLIENT_DOMAIN}/reset-password?token=${forgot_password_token}`
    })

    await this.resetUserActive(user._id.toString())

    return true
  }

  async resetPassword(objectId: ObjectId, payload: ResetPasswordDto) {
    //
    const passwordHashed = hashPassword(payload.password)

    await this.resetUserActive(objectId.toString())

    //
    return await UserCollection.updateOne(
      { _: objectId },
      {
        $set: {
          password: passwordHashed,
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  async verifyEmail(user_id: string) {
    //
    const user = await UserCollection.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new NotFoundError('User not exist')
    }

    await this.resetUserActive(user_id)

    //
    return await UserCollection.updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          verify: EUserVerifyStatus.Verified,
          email_verify_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  async resendVerifyEmail(id: string) {
    //
    const email_verify_token = await signToken({
      payload: { user_id: '', type: TokenType.verifyToken },
      privateKey: envs.JWT_SECRET_TEMP,
      options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
    })

    //
    const user = await UserCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      },
      { returnDocument: 'after' }
    )

    //
    await sendEmailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
      toEmail: user?.email,
      name: user?.name,
      url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
    })

    return true
  }

  async getMe(user_id: string) {
    return await this.getUserActive(user_id)
  }

  async getIdByUsername(username: string) {
    return await UserCollection.findOne({ username }, { projection: { _id: 1 } })
  }

  async updateMe(user_id: string, payload: UpdateMeDto) {
    const user = await UserCollection.findOne({ username: payload.username, _id: { $ne: new ObjectId(user_id) } })
    if (user) {
      throw new ConflictError('Username already exist')
    }

    await this.resetUserActive(user_id)

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

  async changePassword(user_id: string, new_password: string) {
    const passwordHashed = hashPassword(new_password)

    await this.resetUserActive(user_id)

    return await UserCollection.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: passwordHashed
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

  async refreshToken({ user_id, token, exp }: { user_id: string; token: string; exp?: number }) {
    console.log('userService - refreshToken - exp:::', exp)

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      payload: { user_id },
      exp_refresh: exp
    })

    const decoded = await this.verifyToken(refresh_token, envs.JWT_SECRET_REFRESH)
    await Promise.all([
      RefreshTokenCollection.deleteOne({ token }),
      RefreshTokenCollection.insertOne(
        new RefreshTokenSchema({
          token: refresh_token,
          user_id: new ObjectId(user_id),
          iat: decoded.iat,
          exp: decoded.exp
        })
      )
    ])

    return { access_token, refresh_token }
  }

  // Auth use
  async findOneByEmail(email: string) {
    return await UserCollection.findOne(
      { email },
      {
        projection: {
          email: 1,
          password: 1
        }
      }
    )
  }

  // local use
  private async signAccessAndRefreshToken({
    payload,
    exp_refresh
  }: {
    payload: Pick<IJwtPayload, 'user_id'>
    exp_refresh?: number
  }): Promise<[string, string]> {
    return (await Promise.all([
      signToken({
        payload: { ...payload, type: TokenType.accessToken },
        privateKey: envs.JWT_SECRET_ACCESS,
        options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
      }),
      signToken({
        payload: { ...payload, type: TokenType.refreshToken, exp: exp_refresh },
        privateKey: envs.JWT_SECRET_REFRESH,
        options: { expiresIn: envs.REFRESH_TOKEN_EXPIRES_IN as StringValue }
      })
    ])) as [string, string]
  }

  async verifyToken(token: string, privateKey: string) {
    return verifyToken({ token, privateKey })
  }

  async getUserActive(user_id: string) {
    const keyCache = `${CONSTANT_USER.user_active_key_cache}-${user_id}`
    let userActive = await cacheServiceInstance.getCache<IUser>(keyCache)
    if (!userActive) {
      userActive = await UserCollection.findOne(
        { _id: new ObjectId(user_id) },
        { projection: { email_verify_token: 0, forgot_password_token: 0 } }
      )
      await cacheServiceInstance.setCache(keyCache, userActive, { ttl: 300 })
    }

    if (!userActive) {
      throw new NotFoundError('User not found')
    }

    return userActive
  }

  // local use, use in user-modified functions
  private async resetUserActive(user_id: string) {
    const keyCache = `${CONSTANT_USER.user_active_key_cache}-${user_id}`
    await cacheServiceInstance.del(keyCache)
  }
}

export default new UsersService()
