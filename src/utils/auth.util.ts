import { StringValue } from 'ms'
import { EUserTokenType } from '~/shared/enums/public/user-tokens.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { signToken } from './jwt.util'

//
export async function createTokenPair({
  payload,
  exp_refresh,
  private_access_key,
  private_refresh_key,
  expires_in_access,
  expires_in_refresh
}: {
  payload: Pick<IJwtPayload, 'user_id' | 'admin_id' | 'role'>
  exp_refresh?: number
  private_access_key: string
  private_refresh_key: string
  expires_in_access: StringValue
  expires_in_refresh: StringValue
}): Promise<[string, string]> {
  return (await Promise.all([
    signToken({
      expires_in: expires_in_access,
      private_key: private_access_key,
      payload: { ...payload, type: EUserTokenType.AccessToken }
    }),
    signToken({
      expires_in: expires_in_refresh,
      private_key: private_refresh_key,
      payload: { ...payload, type: EUserTokenType.RefreshToken, exp: exp_refresh }
    })
  ])) as [string, string]
}
