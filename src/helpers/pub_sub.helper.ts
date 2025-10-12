import { createClient, RedisClientType } from 'redis'
import { logger } from '~/utils/logger.util'

class PubSubService {
  private publisher: RedisClientType
  private subscriber: RedisClientType
  private isConnected = false

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    this.publisher = createClient({
      url: redisUrl,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) }
    })

    this.subscriber = this.publisher.duplicate()

    this.setupLogging(this.publisher, 'Publisher')
    this.setupLogging(this.subscriber, 'Subscriber')

    this.connect()
  }

  private setupLogging(client: RedisClientType, label: string) {
    client.on('error', (err) => console.error(`Redis ${label} Error:`, err))
    client.on('connect', () => logger.info(`Redis ${label} Connected`))
    client.on('end', () => logger.info(`Redis ${label} Disconnected`))
  }

  private async connect(): Promise<void> {
    try {
      await Promise.all([this.publisher.connect(), this.subscriber.connect()])
      this.isConnected = true
    } catch (err) {
      console.error('Failed to connect to Redis:', err)
      throw err
    }
  }

  async publish(event: string, payload: any) {
    if (!this.isConnected) await this.connect()
    await this.publisher.publish(event, JSON.stringify(payload))
  }

  async subscribe(event: string, cb: (payload: any) => void) {
    if (!this.isConnected) await this.connect()
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
      this.isConnected = false
      logger.info('Redis PubSubService shutdown complete')
    } catch (err) {
      console.error('Error during Redis shutdown:', err)
    }
  }
}

const pubSubServiceInstance = new PubSubService()
export default pubSubServiceInstance
