import { ObjectId } from 'mongodb'
import { StringValue } from 'ms'
import { envs } from '~/configs/env.config'
import cacheServiceInstance from '~/helpers/cache.helper'
import { sendEmailQueue } from '~/libs/bull/queues'
import { UserCollection } from '~/models/schemas/User.schema'
import { NotFoundError } from '~/shared/classes/error.class'
import { CONSTANT_JOB, CONSTANT_USER } from '~/shared/constants'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { ETokenType } from '~/shared/enums/type.enum'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { hashPassword } from '~/utils/crypto.util'
import { signToken } from '~/utils/jwt.util'

class UsersService {
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
      payload: { user_id: '', type: ETokenType.verifyToken },
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
      {
        returnDocument: 'after',
        projection: {
          email: 1,
          name: 1
        }
      }
    )

    //
    console.log('resendVerifyEmail - user:::', user)
    await sendEmailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
      toEmail: user?.email,
      name: user?.name,
      url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
    })

    return true
  }

  async getOneByUsername(username: string) {
    const keyCache = `${CONSTANT_USER.user_active_key_cache}-${username}`
    let user = await cacheServiceInstance.getCache<IUser>(keyCache)
    if (!user) {
      user = await UserCollection.aggregate<IUser>([
        {
          $match: {
            username
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'followed_user_id',
            as: 'followers'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'user_id',
            as: 'following'
          }
        },
        {
          $addFields: {
            follower_count: { $size: '$followers' },
            following_count: { $size: '$following' }
          }
        },
        {
          $project: {
            password: 0,
            followers: 0,
            following: 0,
            email_verify_token: 0,
            forgot_password_token: 0
          }
        }
      ]).next()
    }

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
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

  async getUserActive(user_id: string) {
    const keyCache = `${CONSTANT_USER.user_active_key_cache}-${user_id}`
    let userActive = await cacheServiceInstance.getCache<IUser>(keyCache)
    if (!userActive) {
      userActive = await UserCollection.findOne(
        { _id: new ObjectId(user_id) },
        { projection: { email_verify_token: 0, forgot_password_token: 0, password: 0 } }
      )
      await cacheServiceInstance.setCache(keyCache, userActive, { ttl: 300 })
    }

    if (!userActive) {
      throw new NotFoundError('User not found')
    }

    return userActive
  }

  async resetUserActive(user_id: string) {
    const keyCache = `${CONSTANT_USER.user_active_key_cache}-${user_id}`
    await cacheServiceInstance.del(keyCache)
  }
}

export default new UsersService()
