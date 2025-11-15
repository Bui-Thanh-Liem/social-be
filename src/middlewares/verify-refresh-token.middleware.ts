import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.reponse'
import RefreshTokenService from '~/services/Tokens.service'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const refresh_token = req.body?.refresh_token || undefined

    if (!refresh_token) {
      throw new UnauthorizedError('Trình duyệt không gửi refresh token lên server.')
    }

    //
    const [decoded, tokenInDatabase] = await Promise.all([
      verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH }),
      RefreshTokenService.findByRefreshToken({ refresh_token })
    ])

    //
    req.decoded_refresh_token = decoded

    //
    if (!tokenInDatabase) {
      throw new UnauthorizedError('Server tìm trong database không có refresh token.')
    }

    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
