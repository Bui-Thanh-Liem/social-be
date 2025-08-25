import { JwtPayload } from 'jsonwebtoken'
import { ETokenType } from '~/shared/enums/type.enum'

export interface IJwtPayload extends JwtPayload {
  user_id: string
  type: ETokenType
}
