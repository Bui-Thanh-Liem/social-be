import z from 'zod'
import { LoginAuthDtoSchema } from '../auth-user/auth.dto'

export const LoginAdminDtoSchema = LoginAuthDtoSchema

export type LoginAdminDto = z.infer<typeof LoginAdminDtoSchema>
