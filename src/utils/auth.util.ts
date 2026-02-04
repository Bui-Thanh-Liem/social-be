import { StringValue } from 'ms'
import { envs } from '~/configs/env.config'
import { ETokenType } from '~/shared/enums/type.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { signToken } from './jwt.util'

//
export async function createTokenPair({
  payload,
  exp_refresh,
  private_access_key,
  private_refresh_key
}: {
  payload: Pick<IJwtPayload, 'user_id' | 'admin_id' | 'role'>
  exp_refresh?: number
  private_access_key: string
  private_refresh_key: string
}): Promise<[string, string]> {
  return (await Promise.all([
    signToken({
      privateKey: private_access_key,
      payload: { ...payload, type: ETokenType.AccessToken },
      options: { expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
    }),
    signToken({
      privateKey: private_refresh_key,
      payload: { ...payload, type: ETokenType.RefreshToken, exp: exp_refresh },
      options: { expiresIn: envs.REFRESH_TOKEN_EXPIRES_IN as StringValue }
    })
  ])) as [string, string]
}
