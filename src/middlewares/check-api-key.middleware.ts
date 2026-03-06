import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'

export async function checkApiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.headers['x-api-key'] || ''

    if (!key) {
      throw new UnauthorizedError('Vui lòng cung cấp API key.')
    }

    if (key !== envs.API_KEY) {
      throw new UnauthorizedError('API key không hợp lệ.')
    }

    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
