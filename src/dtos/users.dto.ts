import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const VerifyEmailDtoSchema = z.object({
  email_verify_token: z.string().trim()
})

export const UserIdDtoSchema = z.object({
  user_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const ChangePasswordDtoSchema = z
  .object({
    old_password: z.string().trim(),
    new_password: z.string().trim(),
    confirm_new_password: z.string().trim()
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    path: ['confirm_new_password'],
    message: 'Mật khẩu mới không khớp.'
  })

export type verifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>
export type ToggleFollowDto = z.infer<typeof UserIdDtoSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>
export type UserIdDto = z.infer<typeof UserIdDtoSchema>
