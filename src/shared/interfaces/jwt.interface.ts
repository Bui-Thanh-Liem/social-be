import { JwtPayload } from 'jsonwebtoken'
import { EUserTokenType } from '~/modules/user-tokens/user-tokens.enum'

export interface IJwtPayload extends JwtPayload {
  user_id: string
  type: EUserTokenType
}
