import { redisCluster } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'

interface OptimisticValue<T> {
  data: T
  version: number
}

class OptimisticLockService {
  private client = redisCluster

  constructor() {
    // ioredis tự quản lý kết nối, ta chỉ cần lắng nghe sự kiện
    this.client.on('ready', () => {
      logger.info('Redis Cluster is Ready')
    })

    this.client.on('error', (err) => {
      logger.error('Redis Cluster Error', err)
    })
  }

  async init<T>(key: string, data: T, ttl?: number) {
    const value: OptimisticValue<T> = { data, version: 1 }
    const payload = JSON.stringify(value)

    if (ttl) {
      await this.client.set(key, payload, 'PX', ttl)
    } else {
      await this.client.set(key, payload)
    }
  }

  async get<T>(key: string): Promise<OptimisticValue<T> | null> {
    const value = await this.client.get(key)
    if (!value) return null
    return JSON.parse(value)
  }

  async set<T>(key: string, newData: T, expectedVersion: number, ttl?: number): Promise<boolean> {
    const luaScript = `
      local current = redis.call('GET', KEYS[1])
      if not current then return -1 end
      
      local decoded = cjson.decode(current)
      if decoded.version ~= tonumber(ARGV[1]) then
        return 0
      end
      
      decoded.data = cjson.decode(ARGV[2])
      decoded.version = decoded.version + 1
      
      local newValue = cjson.encode(decoded)
      if ARGV[3] ~= "" then
        redis.call('PSETEX', KEYS[1], ARGV[3], newValue)
      else
        redis.call('SET', KEYS[1], newValue)
      end
      return 1
    `

    try {
      // Cú pháp ioredis: .eval(script, numberOfKeys, ...keys, ...args)
      const result = await this.client.eval(
        luaScript,
        1,
        key,
        expectedVersion.toString(),
        JSON.stringify(newData),
        ttl ? ttl.toString() : ''
      )

      return result === 1
    } catch (err) {
      logger.error('Lua Execution Error', err)
      return false
    }
  }
}

export default new OptimisticLockService()
