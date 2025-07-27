import { NextFunction, Request, Response } from 'express'
import { ToggleFollowDto } from '~/dtos/requests/user.dto'
import UserService from '~/services/Users.service'
import { BadRequestError, UnauthorizedError } from '~/shared/classes/error.class'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

// Verify user coi đã xác thực email chưa
export async function verifyUserActive(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user_id: followed_user_id } = req.params as ToggleFollowDto

    if (user_id === followed_user_id) {
      throw new BadRequestError('Invalid operation (bạn không thể theo dõi chính bạn)')
    }

    const userActive = await UserService.getUserActive(user_id)
    console.log('userActive::', userActive) 
    if (userActive?.verify === EUserVerifyStatus.Unverified) {
      throw new UnauthorizedError('Your account is not verified.')
    }

    next()
  } catch (error) {
    next(error)
  }
}
