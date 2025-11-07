import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ErrorResponse } from '~/shared/classes/response.class'
import { logger } from '~/utils/logger.util'

export const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV === 'development'

  // Thông tin cơ bản
  let statusCode: number = err.statusCode
  let message: string = err.message
  const stack = err.stack

  // Thông tin bổ sung nếu là lỗi Zod
  if (err instanceof ZodError) {
    statusCode = 422

    //
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }))

    //
    message = formattedErrors.map((e) => e.message).join(' - ')

    //
    logger.error('🛑 Zod Validation Error:', {
      issues: err.issues,
      formattedErrors
    })
  }

  // Log đầy đủ để dev dễ debug
  logger.error(`🛑 Error caught (${req.ip}) by middleware:::`, { message })
  console.log({
    message: message,
    statusCode: statusCode,
    stack: stack,
    otherFields: Object.keys(err)
      .filter((k) => !['name', 'message', 'statusCode', 'stack', 'errors', 'issues', 'details'].includes(k))
      .reduce(
        (acc, key) => {
          acc[key] = err[key]
          return acc
        },
        {} as Record<string, any>
      )
  })

  // Trả response ra client
  res.status(statusCode).json(new ErrorResponse(statusCode, message, isDev ? stack : {}))

  return // đảm bảo không rơi vào nhánh nào khác
}
