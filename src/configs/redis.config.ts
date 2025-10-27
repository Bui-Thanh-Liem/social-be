import { envs } from './env.config'

export const redisConnection = {
  host: envs.REDIS_HOST || 'localhost',
  port: Number(envs.REDIS_PORT || 6379)
}
