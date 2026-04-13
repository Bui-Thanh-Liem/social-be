import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '~/core/error.response'

export const queryValidate = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.query || Object.keys(req.query).length === 0) {
      throw new BadRequestError('Thiếu query (query)')
    }

    //
    const parsed = schema.parse(req.query)
    req.queryParsed = parsed

    //
    next()
  } catch (error) {
    next(error)
  }
}
