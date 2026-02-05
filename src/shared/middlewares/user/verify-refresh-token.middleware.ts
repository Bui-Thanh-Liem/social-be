import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'
import RefreshTokenService from '~/modules/tokens/tokens.service'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const refresh_token = req.body?.refresh_token || undefined

    if (!refresh_token) {
      throw new UnauthorizedError('Vui lòng đăng nhập lại. (thiếu refresh token)')
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
      throw new UnauthorizedError('Vui lòng đăng nhập lại. (refresh token không hợp lệ).')
    }

    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
