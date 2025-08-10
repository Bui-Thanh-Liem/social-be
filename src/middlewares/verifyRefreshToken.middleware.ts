import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { RefreshTokenCollection } from '~/models/schemas/RefreshToken.schema'
import { UnauthorizedError } from '~/shared/classes/error.class'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const refresh_token = req.body?.refresh_token || undefined

    if (!refresh_token) {
      throw new UnauthorizedError('Refresh token is required')
    }

    //
    const [decoded, tokenInDatabase] = await Promise.all([
      verifyToken({ token: refresh_token, privateKey: envs.JWT_SECRET_REFRESH }),
      RefreshTokenCollection.findOne({ token: refresh_token })
    ])

    //
    req.decoded_refresh_token = decoded

    //
    if (!tokenInDatabase) {
      throw new UnauthorizedError('Refresh token not exist')
    }

    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
