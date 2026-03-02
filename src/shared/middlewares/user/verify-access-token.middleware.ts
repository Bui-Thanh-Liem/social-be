import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'
import TokensService from '~/modules/tokens/tokens.service'
import UsersService from '~/modules/users/users.service'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers['authorization'] || ''
    const access_token = authorization.split(' ')[1]

    if (!access_token) {
      throw new UnauthorizedError('Vui lòng đăng nhập.')
    }
    const decoded = await verifyToken({ token: access_token, privateKey: envs.JWT_SECRET_ACCESS })

    //
    if (decoded.user_id) {
      const [user, token] = await Promise.all([
        UsersService.getUserActive(decoded.user_id),
        TokensService.findByAccessToken({ access_token, user_id: decoded.user_id })
      ])

      if (!user || !token) {
        throw new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }

      req.user = user
    }

    req.decoded_authorization = decoded
    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
