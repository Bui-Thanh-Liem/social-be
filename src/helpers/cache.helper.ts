import { createClient, RedisClientType, SetOptions } from 'redis'
import { logger } from '~/utils/logger.util'

export class CacheService {
  private client: RedisClientType
  private defaultTTL: number = 600 // 10 minutes in seconds
  private isConnected: boolean = false

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
      }
    })

    this.client.on('error', (err) => console.error('Redis Client Error:', err))
    this.client.on('connect', () => {
      this.isConnected = true
      logger.info('Redis Client Connected')
    })
    this.client.on('end', () => {
      this.isConnected = false
      logger.info('Redis Client Disconnected')
    })

    // Connect immediately
    this.connect()
  }

  private async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect()
      } catch (err) {
        console.error('Failed to connect to Redis:', err)
        throw err
      }
    }
  }

  async setCache<T>(key: string, value: T, options?: SetOptions & { ttl?: number }): Promise<boolean> {
    await this.connect()

    try {
      const storeValue =
        typeof value === 'string' || typeof value === 'number' ? value.toString() : JSON.stringify(value)

      const finalOptions: SetOptions = {
        ...options,
        EX: options?.ttl ?? options?.EX ?? this.defaultTTL
      }

      await this.client.set(key, storeValue, finalOptions)
      return true
    } catch (err) {
      console.error(`Failed to set cache for key ${key}:`, err)
      return false
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    await this.connect()

    try {
      const rawValue = await this.client.get(key)
      if (rawValue === null) return null

      try {
        return JSON.parse(rawValue) as T
      } catch {
        return rawValue as T
      }
    } catch (err) {
      console.error(`Failed to get cache for key ${key}:`, err)
      return null
    }
  }

  async del(key: string): Promise<boolean> {
    await this.connect()

    try {
      const result = await this.client.del(key)
      return result === 1
    } catch (err) {
      console.error(`Failed to delete cache for key ${key}:`, err)
      return false
    }
  }

  async has(key: string): Promise<boolean> {
    await this.connect()

    try {
      const exists = await this.client.exists(key)
      return exists === 1
    } catch (err) {
      console.error(`Failed to check existence of key ${key}:`, err)
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.quit()
        this.isConnected = false
      } catch (err) {
        console.error('Failed to disconnect Redis client:', err)
        throw err
      }
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      await this.disconnect()
    } catch (err) {
      console.error('Error during Redis shutdown:', err)
    }
  }
}

// Singleton instance
const cacheServiceInstance = new CacheService()
export default cacheServiceInstance
