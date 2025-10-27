import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const ParamIdTrendingDtoSchema = z.object({
  trending_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export type ReportTrendingDto = z.infer<typeof ParamIdTrendingDtoSchema>
