import { NextFunction, Request, Response } from 'express'

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const now = new Date()
  logger.info(`[${now.toISOString()}] ${req.method} ${req.url}`)
  next()
}
