import { createCluster, RedisClusterType } from 'redis'
import { redisConfig } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'

interface OptimisticValue<T> {
  data: T
  version: number
}

class OptimisticLockService {
  private client: RedisClusterType
  private isConnected = false

  constructor() {
    const redisUrl = `rediss://${redisConfig.host}:${redisConfig.port}`

    this.client = createCluster({
      rootNodes: [{ url: redisUrl }],
      defaults: {
        socket: {
          tls: true,
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
        }
      }
    })

    this.client.on('connect', () => {
      this.isConnected = true
      logger.info('Redis Cluster Connected')
    })
    this.client.on('error', (err) => logger.error('Redis Cluster Error', err))
    this.connect()
  }

  private async connect() {
    if (!this.isConnected) await this.client.connect()
  }

  async get<T>(key: string): Promise<OptimisticValue<T> | null> {
    await this.connect()
    const value = await this.client.get(key)
    if (!value) return null
    return JSON.parse(value)
  }

  /**
   * Cập nhật sử dụng Lua Script (Atomic Compare-and-Set)
   */
  async set<T>(key: string, newData: T, expectedVersion: number, ttl?: number): Promise<boolean> {
    await this.connect()

    const newValue: OptimisticValue<T> = {
      data: newData,
      version: expectedVersion + 1
    }

    // Lua Script:
    // 1. Lấy giá trị hiện tại
    // 2. Kiểm tra version
    // 3. Nếu đúng version thì SET giá trị mới và trả về 1, ngược lại trả về 0
    const luaScript = `
      local current = redis.call('GET', KEYS[1])
      if not current then return 0 end
      
      local parsed = cjson.decode(current)
      if parsed.version ~= tonumber(ARGV[1]) then
        return 0
      end
      
      redis.call('SET', KEYS[1], ARGV[2])
      if ARGV[3] ~= '0' then
        redis.call('PEXPIRE', KEYS[1], ARGV[3])
      end
      return 1
    `

    try {
      const result = await this.client.eval(luaScript, {
        keys: [key],
        arguments: [expectedVersion.toString(), JSON.stringify(newValue), ttl ? ttl.toString() : '0']
      })

      return result === 1
    } catch (err) {
      logger.error('Optimistic Lock Lua Error', err)
      return false
    }
  }

  async init<T>(key: string, data: T, ttl?: number) {
    await this.connect()
    const value: OptimisticValue<T> = { data, version: 1 }
    const options = ttl ? { PX: ttl } : {}
    await this.client.set(key, JSON.stringify(value), options)
  }
}

const optimisticLockServiceInstance = new OptimisticLockService()
export default optimisticLockServiceInstance
