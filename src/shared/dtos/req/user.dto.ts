import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const verifyEmailDtoSchema = z.object({
  email_verify_token: z.string().trim()
})

export const toggleFollowDtoSchema = z.object({
  user_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export const ChangePasswordDtoSchema = z
  .object({
    old_password: z.string().trim(),
    new_password: z.string().trim(),
    confirm_new_password: z.string().trim()
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    path: ['confirm_password'],
    message: 'New password do not match'
  })

export type verifyEmailDto = z.infer<typeof verifyEmailDtoSchema>
export type ToggleFollowDto = z.infer<typeof toggleFollowDtoSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>
