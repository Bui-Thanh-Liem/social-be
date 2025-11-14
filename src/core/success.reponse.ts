export abstract class AResponse<T = any> {
  statusCode: number = 200
  message: string
  metadata?: T // dùng khi success
  stack?: any // dùng khi error
  constructor({
    statusCode,
    message,
    metadata,
    stack
  }: {
    statusCode: number
    message: string
    metadata?: T
    stack?: any
  }) {
    this.statusCode = statusCode
    this.message = message
    this.metadata = metadata
    this.stack = stack
  }
}

export class OkResponse<T = any> extends AResponse<T> {
  constructor(message = 'OK', metadata?: T) {
    super({ statusCode: 200, message, metadata })
  }
}

export class CreatedResponse<T = any> extends AResponse<T> {
  constructor(message = 'Created', metadata?: T) {
    super({ statusCode: 201, message, metadata })
  }
}
