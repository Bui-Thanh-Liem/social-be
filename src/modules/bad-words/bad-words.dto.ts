import z from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { EPriorityBadWord } from '~/shared/enums/common.enum'

export const ActionBadWordDtoSchema = z.object({
  words: z.string().min(1, 'Vui lòng nhập từ').max(50, 'Tối đa 50 kí tự').trim(),
  replace_with: z.string().min(1, 'Vui lòng nhập từ thay thế').max(50, 'Tối đa 50 kí tự').trim(),
  priority: z.nativeEnum(EPriorityBadWord)
})

export const paramIdBadWordsDtoSchema = z.object({
  bad_word_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export type ActionBadWordDto = z.infer<typeof ActionBadWordDtoSchema>
export type ParamIdBadWordsDto = z.infer<typeof paramIdBadWordsDtoSchema>
