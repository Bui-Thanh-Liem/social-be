import { createClient, RedisClientType } from 'redis'
import { redisConfig } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'

/**
 * 1. GET value + version
 * 2. WATCH key
 * 3. MULTI
 * 4. SET value mới (nếu version chưa đổi)
 * 5. EXEC
 *   - null → conflict → retry
 */
interface OptimisticValue<T> {
  data: T
  version: number
}

class OptimisticLockService {
  private client: RedisClientType
  private isConnected = false

  constructor() {
    const redisUrl = `rediss://${redisConfig.host}:${redisConfig.port}`

    this.client = createClient({
      url: redisUrl,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) }
    })

    this.client.on('connect', () => {
      this.isConnected = true
      logger.info('Redis Client Connected')
    })

    this.client.on('end', () => {
      this.isConnected = false
      logger.info('Redis Client Disconnected')
    })

    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err)
    })

    this.connect()
  }

  private async connect() {
    if (!this.isConnected) {
      await this.client.connect()
    }
  }

  /**
   * Read data with version
   */
  async get<T>(key: string): Promise<OptimisticValue<T> | null> {
    await this.connect()

    const value = await this.client.get(key)
    if (!value) return null

    return JSON.parse(value)
  }

  /**
   * Update with optimistic lock
   */
  async set<T>(key: string, newData: T, expectedVersion: number, ttl?: number): Promise<boolean> {
    await this.connect()

    await this.client.watch(key)

    const current = await this.client.get(key)
    if (!current) {
      await this.client.unwatch()
      return false
    }

    const parsed: OptimisticValue<T> = JSON.parse(current)

    // version changed → conflict
    if (parsed.version !== expectedVersion) {
      await this.client.unwatch()
      return false
    }

    const multi = this.client.multi()

    const newValue: OptimisticValue<T> = {
      data: newData,
      version: expectedVersion + 1
    }

    multi.set(key, JSON.stringify(newValue))
    if (ttl) multi.pExpire(key, ttl)

    const result = await multi.exec()

    // null = conflict
    return result !== null
  }

  /**
   * Init data (no lock)
   */
  async init<T>(key: string, data: T, ttl?: number) {
    await this.connect()

    const value: OptimisticValue<T> = {
      data,
      version: 1
    }

    if (ttl) {
      await this.client.set(key, JSON.stringify(value), { PX: ttl })
    } else {
      await this.client.set(key, JSON.stringify(value))
    }
  }
}

const optimisticLockServiceInstance = new OptimisticLockService()
export default optimisticLockServiceInstance
