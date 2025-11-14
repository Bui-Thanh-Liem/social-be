import jwt, { SignOptions } from 'jsonwebtoken'
import { StringValue } from 'ms'
import { envs } from '~/configs/env.config'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

// Tạo token đơn giản
// muốn bảo mật hơn:
// privateKey → dùng để sign (tạo JWT)
// publicKey → dùng để verify (xác thực JWT)
export async function signToken({
  payload,
  privateKey = envs.JWT_SECRET_ACCESS,
  options = { algorithm: 'HS256', expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as StringValue }
}: {
  payload: IJwtPayload
  privateKey?: string
  options?: SignOptions
}) {
  if (payload?.exp) {
    return new Promise<string>((resolve, reject) => {
      jwt.sign({ ...payload }, privateKey, {}, (err, token) => {
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
    jwt.sign({ ...payload }, privateKey, options, (err, token) => {
      if (err || !token) {
        reject(err)
        return
      }
      resolve(token)
    })
  })
}

export async function verifyToken({ token, privateKey }: { token: string; privateKey: string }) {
  return new Promise<IJwtPayload>((res, rej) => {
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err || !decoded) {
        rej(err)
        return
      }
      res(decoded as IJwtPayload)
    })
  })
}
