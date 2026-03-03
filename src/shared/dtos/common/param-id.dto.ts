import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const ParamIdDtoSchema = z.object({
  id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export type ParamIdDto = z.infer<typeof ParamIdDtoSchema>
