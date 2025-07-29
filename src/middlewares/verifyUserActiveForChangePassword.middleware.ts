import { NextFunction, Request, Response } from 'express'
import UserService from '~/services/Users.service'
import { BadRequestError, UnauthorizedError } from '~/shared/classes/error.class'
import { ChangePasswordDto } from '~/shared/dtos/req/user.dto'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { verifyPassword } from '~/utils/crypto.util'

export async function verifyUserActiveForChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { old_password, new_password } = req.body as ChangePasswordDto

    //
    if (old_password === new_password) {
      throw new BadRequestError('The new password cannot be the same as the current password.')
    }

    //
    const userActive = await UserService.getUserActive(user_id)
    if (userActive?.verify === EUserVerifyStatus.Unverified) {
      throw new UnauthorizedError('Your account is not verified.')
    }

    const verifyPass = verifyPassword(old_password, userActive.password)
    if (!verifyPass) {
      throw new UnauthorizedError('Password not correct')
    }

    next()
  } catch (error) {
    next(error)
  }
}
