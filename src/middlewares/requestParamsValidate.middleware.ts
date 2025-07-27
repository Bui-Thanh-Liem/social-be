import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '~/shared/classes/error.class'

export function requestParamsValidate(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.params || Object.keys(req.params).length === 0) {
        throw new BadRequestError('Thiếu tham số URL (params)')
      }

      req.params = schema.parse(req.params)
      next()
    } catch (error) {
      next(error)
    }
  }
}
