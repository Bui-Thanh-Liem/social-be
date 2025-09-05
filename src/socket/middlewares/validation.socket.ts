import { ZodSchema } from 'zod'
import { Socket } from 'socket.io'

export function withValidationDataFromClient<T>(schema: ZodSchema<T>, handler: (data: T, socket: Socket) => void) {
  return (socket: Socket) => {
    return (data: unknown) => {
      const result = schema.safeParse(data)
      if (!result.success) {
        socket.emit('ERROR', {
          message: 'Invalid data format',
          issues: result.error.errors
        })
        return
      }
      handler(result.data, socket)
    }
  }
}
