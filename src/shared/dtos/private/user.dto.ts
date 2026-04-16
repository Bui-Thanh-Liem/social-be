import z from 'zod'
import { EUserStatus } from '~/shared/enums/public/users.enum'

export const adminChangeUserStatusDtoSchema = z.object({
  status: z.nativeEnum(EUserStatus),
  reason: z.string().trim().max(100, 'Lý do tối đa 100 ký tự')
})

export const adminRemindUserDtoSchema = z.object({
  reason: z.string().trim().max(100, 'Lý do tối đa 100 ký tự')
})

export type AdminChangeUserStatusDto = z.infer<typeof adminChangeUserStatusDtoSchema>
export type AdminRemindUserDto = z.infer<typeof adminRemindUserDtoSchema>
