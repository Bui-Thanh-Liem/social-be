import Redis from 'ioredis'
import { envs } from './env.config'

const redisOptions = {
  host: envs.REDIS_HOST,
  port: Number(envs.REDIS_PORT),

  connectTimeout: 10000,
  showFriendlyErrorStack: true

  // Nếu có auth
  // username: envs.REDIS_USERNAME,
  // password: envs.REDIS_PASSWORD,

  // Nếu dùng TLS (ElastiCache / Redis Cloud)
  // tls: {}
}

const bullRedisOptions = {
  host: envs.REDIS_HOST,
  port: Number(envs.REDIS_PORT),

  maxRetriesPerRequest: null, // 🔥 BẮT BUỘC
  enableReadyCheck: false // khuyến nghị cho BullMQ
}

const redis = new Redis(redisOptions)

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err)
})

export { redis, bullRedisOptions }
