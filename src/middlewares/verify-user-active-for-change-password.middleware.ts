import { NextFunction, Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '~/core/error.reponse'
import { ChangePasswordDto } from '~/shared/dtos/req/user.dto'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { verifyPassword } from '~/utils/crypto.util'

export async function verifyUserActiveForChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req
    const { old_password, new_password } = req.body as ChangePasswordDto

    //
    if (old_password === new_password) {
      throw new BadRequestError('The new password cannot be the same as the current password.')
    }

    //
    if (user?.verify === EUserVerifyStatus.Unverified) {
      throw new UnauthorizedError('Your account is not verified.')
    }

    const verifyPass = verifyPassword(old_password, user!.password)
    if (!verifyPass) {
      throw new UnauthorizedError('Password not correct')
    }

    next()
  } catch (error) {
    next(error)
  }
}
