import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '~/shared/classes/error.class'

export const requestBodyValidate = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new BadRequestError('Thiếu payload (body)')
    }

    req.body = schema.parse(req.body)
    next()
  } catch (error) {
    next(error)
  }
}
