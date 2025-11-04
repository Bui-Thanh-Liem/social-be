import { envs } from './env.config'

export const redisConnection = {
  host: envs.REDIS_HOST,
  port: Number(envs.REDIS_PORT)
}
