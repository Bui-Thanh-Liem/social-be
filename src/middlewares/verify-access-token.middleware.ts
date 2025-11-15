import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import UsersService from '~/services/Users.service'
import { UnauthorizedError } from '~/core/error.reponse'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers['authorization'] || ''
    const access_token = authorization.split(' ')[1]

    if (!access_token) {
      throw new UnauthorizedError('Access token is required')
    }
    const decoded = await verifyToken({ token: access_token, privateKey: envs.JWT_SECRET_ACCESS })

    //
    if (decoded.user_id) {
      const user = await UsersService.getUserActive(decoded.user_id)

      if (!user) {
        throw new UnauthorizedError('Người dùng không tồn tại.')
      }

      req.user = user
    }

    req.decoded_authorization = decoded
    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
