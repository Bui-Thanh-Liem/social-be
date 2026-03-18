import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'

export async function checkApiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.headers['x-api-key'] || ''
    console.log('client sent :::', key)
    console.log('server has :::', envs.API_KEY)

    if (!key) {
      throw new UnauthorizedError('Forbidden: API key is missing.')
    }

    if (key !== envs.API_KEY) {
      throw new UnauthorizedError('Forbidden: API key is invalid.')
    }

    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
