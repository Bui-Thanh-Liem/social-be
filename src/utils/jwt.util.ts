import jwt from 'jsonwebtoken'
import { StringValue } from 'ms'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

/**
 *
 * @param param
 * @returns
 */
export async function signToken({
  payload,
  expires_in,
  private_key
}: {
  private_key: string
  payload: IJwtPayload
  expires_in: StringValue
}) {
  if (payload?.exp) {
    return new Promise<string>((resolve, reject) => {
      jwt.sign({ ...payload }, private_key, {}, (err, token) => {
        if (err || !token) {
          reject(err)
          return
        }
        resolve(token)
      })
    })
  }

  delete payload.exp

  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      { ...payload },
      private_key,
      {
        algorithm: 'HS256',
        expiresIn: expires_in
      },
      (err, token) => {
        if (err || !token) {
          reject(err)
          return
        }
        resolve(token)
      }
    )
  })
}

export async function verifyToken({ token, private_key }: { token: string; private_key: string }) {
  return new Promise<IJwtPayload>((res, rej) => {
    jwt.verify(token, private_key, (err, decoded) => {
      if (err || !decoded) {
        rej(err)
        return
      }
      res(decoded as IJwtPayload)
    })
  })
}
