import z from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const paramIdMediaDtoSchema = z.object({
  media_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export type ParamIdMediaDto = z.infer<typeof paramIdMediaDtoSchema>
