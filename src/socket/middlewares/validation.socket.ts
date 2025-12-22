import { ZodSchema } from 'zod'
import { Socket } from 'socket.io'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'

export function withValidationDataFromClient<T>(
  schema: ZodSchema<T>,
  socket: Socket,
  handler: (data: T, socket: Socket) => void
) {
  return (data: unknown) => {
    const result = schema.safeParse(data)

    //
    if (!result.success) {
      socket.emit(CONSTANT_EVENT_NAMES.ERROR, {
        message: 'Dữ liệu không hợp lệ',
        issues: result.error.errors
      })
      return
    }

    handler(result.data, socket)
  }
}
