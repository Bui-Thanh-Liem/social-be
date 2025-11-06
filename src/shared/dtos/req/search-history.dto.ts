import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const CreateSearchHistoryDtoSchema = z.object({
  text: z.string().trim().optional(),
  trending: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'ObjectId không hợp lệ'
    })
    .optional(),
  user: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'ObjectId không hợp lệ'
    })
    .optional()
})

export type CreateSearchHistoryDto = z.infer<typeof CreateSearchHistoryDtoSchema>
