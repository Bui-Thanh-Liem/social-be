import { NextFunction, Request, Response } from 'express'
import UserService from '~/services/Users.service'
import { UnauthorizedError } from '~/shared/classes/error.class'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

// Verify user coi đã xác thực email chưa
export async function verifyUserActive(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const userActive = await UserService.getUserActive(user_id)

    if (userActive?.verify === EUserVerifyStatus.Unverified) {
      throw new UnauthorizedError('Your account is not verified.')
    }

    next()
  } catch (error) {
    next(error)
  }
}
