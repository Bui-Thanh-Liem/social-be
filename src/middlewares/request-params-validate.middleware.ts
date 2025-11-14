import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { BadRequestError } from '~/core/error.reponse'

export function requestParamsValidate(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('params::', req.params)

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
