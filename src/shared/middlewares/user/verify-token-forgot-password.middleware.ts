import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { envs } from '~/configs/env.config'
import { BadRequestError, UnauthorizedError } from '~/core/error.response'
import { UsersCollection } from '~/modules/users/users.schema'
import { ETokenType } from '~/shared/enums/type.enum'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyTokenForgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body?.forgot_password_token || undefined
    if (!token) {
      throw new UnauthorizedError('Mã làm mới mật khẩu thì bắt buộc.')
    }

    // Kiểm tra xem mã có hợp lệ, còn hạn không
    const decoded = await verifyToken({ token, privateKey: envs.JWT_SECRET_TEMP })

    // Kiểm tra thêm , xem loại token có phải reset password không
    if (decoded.type !== ETokenType.ForgotPasswordToken) {
      throw new BadRequestError('Chúng tôi nhận thấy hành động của bạn không giống người dùng bình thường ?')
    }

    // Kiểm tra xem token này có phải là token reset password của người dùng này không
    const user = await UsersCollection.findOne({ _id: new ObjectId(decoded.user_id), forgot_password_token: token })
    if (!user) {
      throw new UnauthorizedError('Mã làm mới mật khẩu của bạn không hợp lệ.')
    }

    req.user = user
    next()
  } catch (error) {
    const mess = (error as { message: string })?.message

    if (mess === 'jwt expired') {
      next(new BadRequestError('Mã làm mới mật khẩu của bạn đã hết hạn, hãy trở về bước nhập email.'))
    }

    next(new UnauthorizedError(error as string))
  }
}
