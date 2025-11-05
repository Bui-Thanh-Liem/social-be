import { envs } from './env.config'

export const redisConnection = {
  host: envs.REDIS_HOST,
  port: envs.REDIS_PORT,
  maxRetriesPerRequest: null
}
