import { JwtPayload } from 'jsonwebtoken'
import { ETokenType } from '~/modules/tokens/tokens.enum'

export interface IJwtPayload extends JwtPayload {
  user_id: string
  type: ETokenType
}
