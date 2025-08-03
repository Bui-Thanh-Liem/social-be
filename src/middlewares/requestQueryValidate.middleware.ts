import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '~/shared/classes/error.class'

export const requestQueryValidate = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.query || Object.keys(req.query).length === 0) {
      throw new BadRequestError('Thiếu query (query)')
    }

    //
    schema.parse(req.query)

    next()
  } catch (error) {
    next(error)
  }
}
