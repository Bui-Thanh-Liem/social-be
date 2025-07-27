import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UserCollection } from '~/models/schemas/User.schema'
import { UnauthorizedError } from '~/shared/classes/error.class'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyTokenVerifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body?.email_verify_token || undefined

    if (!token) {
      throw new UnauthorizedError('Token is required')
    }

    //
    await verifyToken({ token, privateKey: envs.JWT_SECRET_TEMP })

    //
    const user = await UserCollection.findOne({ email_verify_token: token })
    if (!user) {
      throw new UnauthorizedError('Invalid verify token')
    }

    req.user = user
    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
