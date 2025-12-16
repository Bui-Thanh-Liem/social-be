import { NextFunction, Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '~/core/error.response'
import { ChangePasswordDto } from '~/shared/dtos/req/user.dto'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { verifyPassword } from '~/utils/crypto.util'

export async function verifyUserActiveForChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { user } = req
    const { old_password, new_password } = req.body as ChangePasswordDto

    //
    if (old_password === new_password) {
      throw new BadRequestError('Mật khẩu mới không được giống mật khẩu cũ.')
    }

    //
    if (user?.verify === EUserVerifyStatus.Unverified) {
      throw new UnauthorizedError('Tài khoản của bạn chưa được xác thực.')
    }

    const verifyPass = verifyPassword(old_password, user!.password)
    if (!verifyPass) {
      throw new UnauthorizedError('Mật khẩu cũ không đúng')
    }

    next()
  } catch (error) {
    next(error)
  }
}
