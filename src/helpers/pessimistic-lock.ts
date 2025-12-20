import { createClient, RedisClientType } from 'redis'
import { redisConfig } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'

class PessimisticLockService {
  private client: RedisClientType
  private isConnected: boolean = false

  constructor() {
    const redisUrl = `redis://${redisConfig.host}:${redisConfig.port}`

    this.client = createClient({
      url: redisUrl,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) }
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

    this.connect()
  }

  async set(key: string, value: string, ttl: number): Promise<string | null> {
    await this.connect()

    return await this.client.set(key, value, {
      NX: true,
      PX: ttl
    })
  }

  async get(key: string): Promise<string | null> {
    await this.connect()
    return await this.client.get(key)
  }

  async release(key: string): Promise<number> {
    await this.connect()
    return await this.client.del(key)
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
}

const pessimisticLockServiceInstance = new PessimisticLockService()
export default pessimisticLockServiceInstance
