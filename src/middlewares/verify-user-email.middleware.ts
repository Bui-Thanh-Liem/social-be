import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '~/core/error.reponse'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'

// Verify user coi đã xác thực email chưa
export async function verifyUserEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req

    if (user?.verify === EUserVerifyStatus.Unverified) {
      throw new UnauthorizedError('Tài khoản của bạn chưa được xác minh, xác minh ở trang cá nhân của bạn.')
    }

    next()
  } catch (error) {
    next(error)
  }
}
