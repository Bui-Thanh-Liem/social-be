import z from 'zod'
import { ETweetStatus } from '~/shared/enums/public/tweets.enum'

export const adminChangeTweetStatusDtoSchema = z.object({
  status: z.nativeEnum(ETweetStatus),
  reason: z.string().trim().max(100, 'Lý do tối đa 100 ký tự')
})

export const adminRemindTweetDtoSchema = z.object({
  reason: z.string().trim().max(100, 'Lý do tối đa 100 ký tự')
})

export type AdminChangeTweetStatusDto = z.infer<typeof adminChangeTweetStatusDtoSchema>
export type AdminRemindTweetDto = z.infer<typeof adminRemindTweetDtoSchema>
