import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const verifyEmailDtoSchema = z.object({
  email_verify_token: z.string().trim()
})

export const UpdateMeDtoSchema = z.object({
  name: z.string().min(1).max(20).trim().optional(),
  day_of_birth: z
    .preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg)
      }
      return arg
    }, z.date())
    .optional(),
  bio: z.string().min(1).max(200).trim().optional(),
  location: z.string().min(1).max(200).trim().optional(),
  website: z.string().min(1).max(100).trim().optional(),
  username: z.string().min(1).max(50).trim().regex(CONSTANT_REGEX.USERNAME, { message: 'Invalid username' }).optional(),
  avatar: z.string().min(1).max(400).trim().optional(),
  cover_photo: z.string().min(1).max(400).trim().optional()
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

export type UpdateMeDto = z.infer<typeof UpdateMeDtoSchema>
export type ToggleFollowDto = z.infer<typeof toggleFollowDtoSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>
