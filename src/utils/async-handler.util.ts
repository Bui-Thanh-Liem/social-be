import { NextFunction, Request, RequestHandler, Response } from 'express'

export const asyncHandler = (func: RequestHandler) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await func(req, res, next)
  } catch (error) {
    console.log('asyncHandler - error:::', error)
    next(error)
  }
}
