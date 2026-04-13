import { ObjectId } from 'mongodb'
import { StringValue } from 'ms'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { envs } from '~/configs/env.config'
import { NotFoundError, UnauthorizedError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import { emailQueue } from '~/infra/queues'
import { IUser } from '~/interfaces/public/users.interface'
import { UsersCollection, UsersSchema } from '~/models/public/users.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { IQuery } from '~/shared/interfaces/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { createKeyUserActive } from '~/utils/create-key-cache.util'
import { hashPassword } from '~/utils/crypto.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { signToken, verifyToken } from '~/utils/jwt.util'
import { logger } from '~/utils/logger.util'
import { EUserTokenType } from '../../enums/public/user-tokens.enum'
import { EUserVerifyStatus } from '../../enums/public/user.enum'
import accessRecentService from './access-recents.service'
import followsService from './follows.service'
import { getFilterQuery } from '~/utils/get-filter-query.util'
import { ResMultiDto } from '~/shared/dtos/common/res-multi.dto'

class UsersService {
  async verifyEmail({
    user_id,
    email_verify_token
  }: {
    user_id: string
    email_verify_token: string
  }): Promise<Pick<IUser, 'email' | 'verify'>> {
    //
    if (!email_verify_token) {
      throw new NotFoundError('Token thì bắt buộc.')
    }

    //
    await verifyToken({ token: email_verify_token, private_key: envs.JWT_SECRET_TEMP_USER })

    //
    const user = await UsersCollection.findOne({ email_verify_token })

    //
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }

    const user_id_from_token = user._id.toString()
    if (user_id_from_token !== user_id) {
      logger.error(`Người dùng ${user_id} đã sử dụng email_verify_token của ${user_id_from_token}`)
      throw new UnauthorizedError('Có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại.')
    }

    await this.resetUserActive(user_id)

    //
    await UsersCollection.updateOne(
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

    return { email: user.email, verify: EUserVerifyStatus.Verified }
  }

  async resendVerifyEmail(id: string) {
    //
    const email_verify_token = await signToken({
      payload: { user_id: id, type: EUserTokenType.VerifyToken, admin_id: '', role: 'user' },
      private_key: envs.JWT_SECRET_TEMP_USER,
      expires_in: envs.JWT_EXPIRES_IN_15M
    })

    //
    const user = await UsersCollection.findOneAndUpdate(
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
    await emailQueue.add(CONSTANT_JOB.VERIFY_MAIL, {
      to_email: user?.email,
      name: user?.name,
      url: `${envs.CLIENT_DOMAIN}/verify?token=${email_verify_token}`
    })

    return true
  }

  async getOneByUsername(username: string, user_id_active: string) {
    const user = await UsersCollection.aggregate<IUser>([
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

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }

    // Lưu vào truy cập gần đây
    await accessRecentService.create({
      type: 'user',
      user_id: user_id_active,
      ref_id: user._id?.toString() || ''
    })

    return this.signedCloudfrontAvatarUrls(user) as IUser
  }

  async getMultiForMentions(username: string) {
    const users = await UsersCollection.aggregate<IUser>([
      {
        $match: {
          username: { $regex: username, $options: 'i' }
        }
      },
      { $skip: 0 },
      { $limit: 20 },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          verify: 1,
          username: 1
        }
      }
    ]).toArray()

    return this.signedCloudfrontAvatarUrls(users) as IUser[]
  }

  async getFollowedUsersBasic({
    user_id,
    query
  }: {
    user_id: string
    query: IQuery<IUser>
  }): Promise<ResMultiType<IUser>> {
    //
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<IUser>(query)

    //
    const has_q = {
      query: {}
    }

    if (q) {
      has_q.query = { $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }] }
    }

    //
    const followed_user_ids = await followsService.getUserFollowers(user_id)
    const users = await UsersCollection.aggregate<UsersSchema>([
      {
        $match: {
          _id: { $in: followed_user_ids },
          ...has_q.query
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
          isFollow: {
            $in: [new ObjectId(user_id), '$followers.user_id']
          }
        }
      },
      {
        $project: {
          name: 1,
          username: 1,
          verify: 1,
          avatar: 1,
          bio: 1,
          isFollow: 1
        }
      }
    ]).toArray()

    const total = await UsersCollection.countDocuments({
      _id: { $in: followed_user_ids.map((id) => new ObjectId(id)) }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontAvatarUrls(users) as IUser[]
    }
  }

  async getFollowingUsersBasic({ id, query }: { id: string; query: IQuery<IUser> }): Promise<ResMultiType<IUser>> {
    //
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<IUser>(query)

    //
    const has_q = {
      query: {}
    }

    //
    if (q) {
      has_q.query = { $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }] }
    }

    //
    const following_user_ids = await followsService.getUserFollowing(id)
    const users = await UsersCollection.aggregate<UsersSchema>([
      {
        $match: {
          _id: { $in: following_user_ids },
          ...has_q.query
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
          isFollow: {
            $in: [new ObjectId(id), '$followers.user_id']
          }
        }
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          username: 1,
          verify: 1,
          bio: 1,
          isFollow: 1
        }
      }
    ]).toArray()

    const total = await UsersCollection.countDocuments({
      _id: { $in: following_user_ids.map((id) => new ObjectId(id)) }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontAvatarUrls(users) as IUser[]
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

    const users = await UsersCollection.aggregate<UsersSchema>([
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
    const totalCount = await UsersCollection.aggregate([
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
      total,
      total_page,
      items: this.signedCloudfrontAvatarUrls(users) as IUser[]
    }
  }

  async changePassword(user_id: string, new_password: string) {
    const passwordHashed = hashPassword(new_password)

    await this.resetUserActive(user_id)

    return await UsersCollection.findOneAndUpdate(
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
    const keyCache = createKeyUserActive(user_id)
    let userActive = await cacheService.get<IUser>(keyCache)
    if (!userActive) {
      console.log('❌ cache hết hạn lấy người dùng hiện tại trong database 🤦‍♂️')
      userActive = await UsersCollection.findOne(
        { _id: new ObjectId(user_id) },
        { projection: { email_verify_token: 0, forgot_password_token: 0, password: 0 } }
      )
      await cacheService.set(keyCache, userActive, 300)
    }

    if (!userActive) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }

    return this.signedCloudfrontAvatarUrls(userActive) as IUser
  }

  async resetUserActive(user_id: string) {
    const keyCache = createKeyUserActive(user_id)
    await cacheService.del(keyCache)
  }

  async checkUsersExist(_ids: string[]) {
    const objectIds = _ids.map((_id) => new ObjectId(_id))
    const isExist = await UsersCollection.countDocuments({ _id: { $in: objectIds } })
    if (!isExist) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }
    return isExist
  }

  //
  async findOneByEmail(email: string) {
    return await UsersCollection.findOne(
      { email },
      {
        projection: {
          email: 1,
          password: 1,
          status: 1
        }
      }
    )
  }

  //
  async findOneById(id: string) {
    const user = await UsersCollection.findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          email: 1
        }
      }
    )

    return this.signedCloudfrontAvatarUrls(user) as IUser
  }

  //
  async pinnedReel({ user_id, isPinned }: { user_id: string; isPinned: boolean }) {
    //
    const user = await UsersCollection.countDocuments({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại.')
    }

    //
    return await UsersCollection.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          isPinnedReel: isPinned
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  //
  async getGuestUsers() {
    const guestEmails = [
      envs.GUEST_EMAIL_1,
      envs.GUEST_EMAIL_2,
      envs.GUEST_EMAIL_3,
      envs.GUEST_EMAIL_4,
      envs.GUEST_EMAIL_5,
      envs.GUEST_EMAIL_6,
      envs.GUEST_EMAIL_7,
      envs.GUEST_EMAIL_8,
      envs.GUEST_EMAIL_9,
      envs.GUEST_EMAIL_10
    ]
    const users = await UsersCollection.find(
      { email: { $in: guestEmails } },
      { projection: { email: 1, avatar: 1 } }
    ).toArray()

    return users
    // return this.signedCloudfrontAvatarUrls(users) as IUser[]
  }

  // ===== ADMIN =====
  async adminGetUsers({ admin_id, query }: { admin_id: string; query: IQuery<IUser> }): Promise<ResMultiDto<IUser>> {
    //
    const { skip, limit, sort, q, qf } = getPaginationAndSafeQuery<IUser>(query)
    let filter: any = q
      ? {
          $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }]
        }
      : {}

    //
    filter = getFilterQuery(qf, filter as any)

    // Trường hợp đặt biệt , status lồng trong 2 cấp
    if (filter?.status) {
      filter['status.status'] = filter.status
      delete filter.status
    }

    //
    const [users, total] = await Promise.all([
      UsersCollection.aggregate<UsersSchema>([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0
          }
        }
      ]).toArray(),
      UsersCollection.countDocuments(filter)
    ])

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontAvatarUrls(users) as IUser[]
    }
  }

  //
  signedCloudfrontAvatarUrls = (users: IUser[] | IUser | null) => {
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

export default new UsersService()
