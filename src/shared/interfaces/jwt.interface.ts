import { JwtPayload } from 'jsonwebtoken'
import { EUserTokenType } from '~/enums/public/user-tokens.enum'

export interface IJwtPayload extends JwtPayload {
  user_id: string
  admin_id: string
  type: EUserTokenType
  role: 'user' | 'admin'
}
