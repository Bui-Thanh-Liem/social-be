import { JwtPayload } from 'jsonwebtoken'
import { ETokenType } from '~/modules/user-tokens/user-tokens.enum'

export interface IJwtPayload extends JwtPayload {
  user_id: string
  type: ETokenType
}
