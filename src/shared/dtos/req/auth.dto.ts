import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const RegisterUserDtoSchema = z
  .object({
    name: z.string().min(1).max(20).trim(),
    email: z.string().email().trim(),
    password: z
      .string()
      .regex(CONSTANT_REGEX.STRONG_PASSWORD, {
        message:
          'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character'
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
    message: 'Passwords do not match'
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
  email: z.string().email().trim()
})

export const ResetPasswordDtoSchema = z
  .object({
    password: z.string().trim(),
    confirm_password: z.string().trim(),
    forgot_password_token: z.string().trim()
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Mật khẩu không khớp'
  })

export type RegisterUserDto = z.infer<typeof RegisterUserDtoSchema>
export type LoginUserDto = z.infer<typeof LoginUserDtoSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>
