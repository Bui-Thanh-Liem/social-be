import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const RegisterUserDtoSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên').min(5, 'Tối thiểu 5 kí tự').max(16, 'Tối đa 16 kí tự').trim(),
    email: z.string().email('Email không hợp lệ').trim(),
    password: z
      .string()
      .regex(CONSTANT_REGEX.STRONG_PASSWORD, {
        message: 'Ít nhất 8 ký tự, chữ cái viết hoa, chữ cái viết thường, ký tự đặc biệt'
      })
      .trim(),
    confirm_password: z.string().trim(),
    day_of_birth: z.preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg)
      }
      return arg
    }, z.date())
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Mật khẩu không khớp'
  })

export const LoginUserDtoSchema = z.object({
  password: z.string().trim().min(1, 'Vui lòng nhập mật khẩu'),
  email: z.string().email('Email không hợp lệ')
})

export const logoutUserDtoSchema = z.object({
  refresh_token: z.string().trim(),
  password: z.string().trim()
})

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email('Email không hợp lệ').trim()
})

export const ResetPasswordDtoSchema = z
  .object({
    password: z
      .string()
      .regex(CONSTANT_REGEX.STRONG_PASSWORD, {
        message: 'Ít nhất 8 ký tự, chữ cái viết hoa, chữ cái viết thường, ký tự đặc biệt'
      })
      .trim(),
    confirm_password: z.string().trim(),
    forgot_password_token: z.string().trim()
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Mật khẩu không khớp'
  })

export const UpdateMeDtoSchema = z.object({
  name: z.string().min(1).max(16).trim().optional(),
  day_of_birth: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) {
      const d = new Date(arg)
      if (!isNaN(d.getTime())) return d
    }
    return undefined
  }, z.date().optional()),
  bio: z.string().max(200).trim().optional(),
  location: z.string().max(16).trim().optional(),
  website: z.string().max(30).trim().optional(),
  username: z
    .string()
    .min(1)
    .max(20, { message: 'Tối đa 20 kí tự' })
    .trim()
    .regex(CONSTANT_REGEX.USERNAME, { message: 'Tên người dùng không hợp lệ (@liem_dev)' })
    .optional(),
  avatar: z.string().max(400).trim().optional(),
  cover_photo: z.string().max(400).trim().optional()
})

export type RegisterUserDto = z.infer<typeof RegisterUserDtoSchema>
export type LoginUserDto = z.infer<typeof LoginUserDtoSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>
export type UpdateMeDto = z.infer<typeof UpdateMeDtoSchema>
