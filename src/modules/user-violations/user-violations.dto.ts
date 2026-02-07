import z from 'zod'
import { ESourceViolation } from '~/shared/enums/common.enum'

export const createUserViolationsDtoSchema = z.object({
  user_id: z.string().trim(),
  bad_word_ids: z.array(z.string().trim()),
  final_content: z.string().trim(),
  source: z.nativeEnum(ESourceViolation),
  source_id: z.string().trim()
})

export type CreateUserViolationsDto = z.infer<typeof createUserViolationsDtoSchema>
