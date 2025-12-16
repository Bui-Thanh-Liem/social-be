import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { FollowerCollection } from '~/models/schemas/Follower.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { BadRequestError, UnauthorizedError } from '~/core/error.response'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { convertObjectId } from '~/utils/convert-object-id'

export async function checkAudience(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id: author, audience } = req.tweet as ITweet
    const { _id: authorId } = author as unknown as IUser

    // Kiểm tra tác giả ổn không
    const user = await UserCollection.findOne(
      { _id: convertObjectId(authorId!) },
      { projection: { _id: 1, verify: 1 } }
    )

    if (!user || user.verify === EUserVerifyStatus.Banned) {
      throw new UnauthorizedError('Tác giả không tồn tại hoặc đã bị khóa tài khoản')
    }

    // Kiểm tra audience của tweet là gì
    if (audience === ETweetAudience.Followers) {
      // Có đăng nhập không
      if (!req?.decoded_authorization) {
        throw new UnauthorizedError('Bài viết này bạn phải đăng nhập mới xem được')
      }

      // Kiểm tra người xem có trong follows không
      const { user_id: user_active_id } = req.decoded_authorization as IJwtPayload

      //
      const follow = await FollowerCollection.findOne({
        user_id: new ObjectId(user_active_id), // muốn xem tweet của người ta thì phải theo dõi người ta
        followed_user_id: authorId
      })
      if (!follow) {
        throw new BadRequestError('Bạn chưa theo dõi tác giả bài viết này')
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}
