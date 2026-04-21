import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { ForbiddenError, UnauthorizedError } from '~/core/error.response'
import UsersService from '~/services/public/users.service'
import { EUserStatus } from '~/shared/enums/public/users.enum'
import authGateway from '~/socket/gateways/auth.gateway'
import { verifyToken } from '~/utils/jwt.util'

export async function authenticationUserMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers['authorization'] || ''
    const access_token = authorization.split(' ')[1]

    if (!access_token) {
      throw new UnauthorizedError('Vui lòng đăng nhập.')
    }
    const decoded = await verifyToken({ token: access_token, private_key: envs.JWT_SECRET_ACCESS_USER })

    //
    if (decoded.user_id) {
      const user = await UsersService.getUserActive(decoded.user_id)

      if (!user) {
        authGateway.logoutUser(decoded.user_id) // Đăng xuất user khỏi tất cả các thiết bị đang đăng nhập
        throw new UnauthorizedError('Vui lòng đăng nhập.')
      }

      if (user.status.status === EUserStatus.Block) {
        throw new ForbiddenError(`Tài khoản của bạn đã bị khoá (${user.status.reason}), vui lòng liên hệ quản trị viên`)
      }

      req.user = user
    }

    req.decoded_authorization = decoded
    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
