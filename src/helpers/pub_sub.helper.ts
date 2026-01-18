import { createCluster, RedisClusterType } from 'redis'
import { redisConfig } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'

class PubSubService {
  private publisher: RedisClusterType
  private subscriber: RedisClusterType

  constructor() {
    const redisUrl = `rediss://${redisConfig.host}:${redisConfig.port}`

    this.publisher = createCluster({
      rootNodes: [
        {
          url: redisUrl
        }
      ],
      defaults: {
        socket: {
          tls: true,
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
        }
      }
    })
    this.subscriber = this.publisher.duplicate()

    this.setupLogging(this.publisher, 'Publisher')
    this.setupLogging(this.subscriber, 'Subscriber')

    // this.connect()
  }

  // Hàm helper để kết nối an toàn
  private async safeConnect(client: RedisClusterType) {
    if (!client.isOpen) {
      try {
        await client.connect()
      } catch (err: any) {
        if (!err.message.includes('Socket already opened')) throw err
      }
    }
  }

  private setupLogging(client: RedisClusterType, label: string) {
    client.on('error', (err) => console.error(`Redis ${label} Error:`, err))
    if (!client.isOpen) client.on('connect', () => logger.info(`Redis ${label} Connected`))
    client.on('end', () => logger.info(`Redis ${label} Disconnected`))
  }

  private async connect(): Promise<void> {
    await Promise.all([this.safeConnect(this.publisher), this.safeConnect(this.subscriber)])
  }

  async publish(event: string, payload: any) {
    await this.connect()
    await this.publisher.publish(event, JSON.stringify(payload))
  }

  async subscribe(event: string, cb: (payload: any) => void) {
    await this.connect()
    await this.subscriber.subscribe(event, (message) => {
      try {
        cb(JSON.parse(message))
      } catch {
        cb(message)
      }
    })
  }

  async shutdown(): Promise<void> {
    try {
      await Promise.all([this.publisher.quit(), this.subscriber.quit()])
      logger.info('Redis PubSubService shutdown complete')
    } catch (err) {
      console.error('Error during Redis shutdown:', err)
    }
  }
}

const pubSubServiceInstance = new PubSubService()
export default pubSubServiceInstance
