import z from 'zod'
import { EPriorityBadWord } from '~/shared/enums/common.enum'

export const CreateBadWordDtoSchema = z.object({
  words: z.string().min(1, 'Vui lòng nhập từ').trim(),
  replace_with: z.string().min(1, 'Vui lòng nhập từ thay thế').trim(),
  priority: z.nativeEnum(EPriorityBadWord)
})

export type CreateBadWordDto = z.infer<typeof CreateBadWordDtoSchema>
