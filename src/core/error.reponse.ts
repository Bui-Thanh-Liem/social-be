import { AResponse } from './success.reponse'

export abstract class AError extends Error {
  // để lấy stack
  statusCode: number = 500
  constructor(statusCode: number, message = 'Internal Server Error') {
    super(message)
    this.statusCode = statusCode
  }
}

export class InternalServerError extends AError {
  constructor(message = 'Internal Server Error') {
    super(500, message)
  }
}

export class BadRequestError extends AError {
  constructor(message = 'Bad Request') {
    super(400, message)
  }
}

export class UnauthorizedError extends AError {
  constructor(message = 'Unauthorized') {
    super(401, message)
  }
}

export class ForbiddenError extends AError {
  constructor(message = 'Forbidden') {
    super(403, message)
  }
}

export class NotFoundError extends AError {
  constructor(message = 'Not Found') {
    super(404, message)
  }
}

export class ConflictError extends AError {
  constructor(message = 'Conflict Error') {
    super(409, message)
  }
}

export class ValidateError extends AError {
  // ít dùng, do sử dụng zod ở DTO và format error ở Error handler
  constructor(message = 'Validate Error') {
    super(422, message)
  }
}

export class ErrorResponse<T = any> extends AResponse<T> {
  constructor(statusCode: number, message = 'Error', stack?: any) {
    super({ statusCode, message, stack })
  }
}
