import { pbkdf2Sync } from 'node:crypto'
import { envs } from '~/configs/env.config'

const _ITERATIONS = 10
const _KEYLEN = 64
const _DIGEST = 'sha512'

export function hashPassword(password: string) {
  return pbkdf2Sync(password, envs.PASSWORD_SALT, _ITERATIONS, _KEYLEN, _DIGEST).toString('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashVerify = pbkdf2Sync(password, envs.PASSWORD_SALT, _ITERATIONS, _KEYLEN, _DIGEST).toString('hex')
  return hash === hashVerify
}

export function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    password += chars[randomIndex]
  }
  return password
}
