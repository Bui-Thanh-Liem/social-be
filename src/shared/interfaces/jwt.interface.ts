import { JwtPayload } from 'jsonwebtoken'
import { EUserTokenType } from '~/enums/user-tokens.enum'

export interface IJwtPayload extends JwtPayload {
  user_id: string
  type: EUserTokenType
}
