import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { ENotificationType } from '~/shared/enums/type.enum'

export const CreateNotiDtoSchema = z.object({
  content: z.string().trim(),
  type: z.nativeEnum(ENotificationType),
  sender: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  }),
  receiver: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  }),
  refId: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'Invalid MongoDB ObjectId'
    })
    .optional()
})

export const GetMultiByTypeNotiDtoSchema = z.object({
  type: z.nativeEnum(ENotificationType)
})

export const ParamIdNotiDtoSchema = z.object({
  noti_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export type CreateNotiDto = z.infer<typeof CreateNotiDtoSchema>
export type GetMultiByTypeNotiDto = z.infer<typeof GetMultiByTypeNotiDtoSchema>
export type DelNotiDto = z.infer<typeof ParamIdNotiDtoSchema>
export type ReadNotiDto = z.infer<typeof ParamIdNotiDtoSchema>
