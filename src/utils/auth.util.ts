import { StringValue } from 'ms'
import { envs } from '~/configs/env.config'
import { ETokenType } from '~/shared/enums/type.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { signToken } from './jwt.util'

//
export async function createTokenPair({
  payload,
  exp_refresh
}: {
  payload: Pick<IJwtPayload, 'user_id'>
  exp_refresh?: number
}): Promise<[string, string]> {
  return (await Promise.all([
    signToken({
      privateKey: envs.JWT_SECRET_ACCESS,
      payload: { ...payload, type: ETokenType.AccessToken },
      options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
    }),
    signToken({
      privateKey: envs.JWT_SECRET_REFRESH,
      payload: { ...payload, type: ETokenType.RefreshToken, exp: exp_refresh },
      options: { expiresIn: envs.REFRESH_TOKEN_EXPIRES_IN as StringValue }
    })
  ])) as [string, string]
}
