import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ErrorResponse } from '~/core/error.response'

export const errorHandler: ErrorRequestHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV === 'development'

  // Thông tin cơ bản
  let statusCode: number = err.statusCode || 500
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
  }

  // Log đầy đủ để dev dễ debug
  const resError = {
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
  }
  console.log('resError :::', resError)

  // Trả response ra client
  res.status(statusCode).json(new ErrorResponse(statusCode, message, isDev && stack))

  return // đảm bảo không rơi vào nhánh nào khác
}
