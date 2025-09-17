import { ObjectId } from 'mongodb'
import { StringValue } from 'ms'
import { envs } from '~/configs/env.config'
import cacheServiceInstance from '~/helpers/cache.helper'
import { sendEmailQueue } from '~/libs/bull/queues'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import { NotFoundError } from '~/shared/classes/error.class'
import { CONSTANT_JOB, CONSTANT_USER } from '~/shared/constants'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { ETokenType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { hashPassword } from '~/utils/crypto.util'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { signToken } from '~/utils/jwt.util'
import { logger } from '~/utils/logger.util'
import FollowsService from './Follows.service'

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
    logger.info('resendVerifyEmail - user:::', user)
    await sendEmailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
      toEmail: user?.email,
      name: user?.name,
      url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
    })

    return true
  }

  async getOneByUsername(username: string, user_id_active: string) {
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
            following_count: { $size: '$following' },
            isFollow: {
              $in: [new ObjectId(user_id_active), '$followers.user_id']
            }
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

  async getFollowedUsersBasic({
    user_id_active,
    query
  }: {
    user_id_active: string
    query: IQuery<IUser>
  }): Promise<ResMultiType<IUser>> {
    //
    const { skip, limit, sort } = getPaginationAndSafeQuery<IUser>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowers(user_id_active)
    const users = await UserCollection.aggregate<UserSchema>([
      {
        $match: {
          _id: { $in: followed_user_ids }
        }
      },
      {
        $sort: sort
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          avatar: 1
        }
      }
    ]).toArray()

    const total = await UserCollection.countDocuments({
      _id: { $in: followed_user_ids.map((id) => new ObjectId(id)) }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: users
    }
  }

  async getTopFollowedUsers({
    query,
    user_id
  }: {
    query: IQuery<IUser>
    user_id: string
  }): Promise<ResMultiType<IUser>> {
    const { skip, limit } = getPaginationAndSafeQuery<IUser>(query)

    const users = await UserCollection.aggregate<UserSchema>([
      // bỏ chính mình
      {
        $match: {
          _id: { $ne: new ObjectId(user_id) }
        }
      },
      // lấy số lượng follower của user
      {
        $lookup: {
          from: 'followers',
          localField: '_id',
          foreignField: 'followed_user_id',
          as: 'followers'
        }
      },
      {
        $addFields: {
          followersCount: { $size: '$followers' }
        }
      },
      // check xem current user có follow họ không
      {
        $lookup: {
          from: 'followers',
          let: { targetId: '$_id', currentUser: new ObjectId(user_id) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$followed_user_id', '$$targetId'] }, { $eq: ['$user_id', '$$currentUser'] }]
                }
              }
            }
          ],
          as: 'alreadyFollowed'
        }
      },
      // loại bỏ user mà mình đã follow
      {
        $match: {
          alreadyFollowed: { $size: 0 }
        }
      },
      // ✅ Sắp xếp ổn định với 2 tiêu chí
      {
        $sort: {
          followersCount: -1, // Theo số followers giảm dần
          _id: 1 // Theo _id tăng dần (làm tie-breaker)
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          username: 1,
          verify: 1,
          avatar: 1,
          followersCount: 1
        }
      }
    ]).toArray()

    // ✅ Tính total chính xác cho pagination
    const totalCount = await UserCollection.aggregate([
      {
        $match: {
          _id: { $ne: new ObjectId(user_id) }
        }
      },
      {
        $lookup: {
          from: 'followers',
          let: { targetId: '$_id', currentUser: new ObjectId(user_id) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$followed_user_id', '$$targetId'] }, { $eq: ['$user_id', '$$currentUser'] }]
                }
              }
            }
          ],
          as: 'alreadyFollowed'
        }
      },
      {
        $match: {
          alreadyFollowed: { $size: 0 }
        }
      },
      { $count: 'total' }
    ]).toArray()

    const total = totalCount[0]?.total || 0
    const total_page = Math.ceil(total / limit)

    return {
      items: users,
      total_page,
      total
    }
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

  async checkExist(_ids: string[]) {
    const objectIds = _ids.map((_id) => new ObjectId(_id))
    const isExist = await UserCollection.countDocuments({ _id: { $in: objectIds } })
    if (!isExist) {
      throw new NotFoundError('Người dùng không tồn tại')
    }
    return isExist
  }
}

export default new UsersService()
