import { redisCluster } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'
import { Cluster } from 'ioredis'

class PubSubService {
  private publisher: Cluster
  private subscriber: Cluster

  constructor() {
    // Trong ioredis, chúng ta sử dụng lại cấu hình của publisher
    this.publisher = redisCluster

    // Subscriber cần một connection riêng biệt hoàn toàn
    // duplicate() sẽ sao chép toàn bộ cấu hình (bao gồm cả natMap)
    this.subscriber = (this.publisher as any).duplicate()

    this.setupLogging(this.publisher, 'Publisher')
    this.setupLogging(this.subscriber, 'Subscriber')
  }

  private setupLogging(client: Cluster, label: string) {
    client.on('ready', () => logger.info(`Redis ${label} - Ready`))
    client.on('error', (err) => logger.error(`Redis ${label} Error:`, err))
    client.on('end', () => logger.info(`Redis ${label} Disconnected`))
  }

  /**
   * Gửi thông điệp
   */
  async publish(event: string, payload: any) {
    try {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
      await this.publisher.publish(event, message)
    } catch (err) {
      logger.error(`Publish Error on event ${event}:`, err)
    }
  }

  /**
   * Đăng ký nhận thông điệp
   */
  async subscribe(event: string, cb: (payload: any) => void) {
    try {
      await this.subscriber.subscribe(event)

      this.subscriber.on('message', (channel, message) => {
        if (channel === event) {
          try {
            cb(JSON.parse(message))
          } catch {
            cb(message)
          }
        }
      })

      logger.info(`Subscribed to channel: ${event}`)
    } catch (err) {
      logger.error(`Subscribe Error on event ${event}:`, err)
    }
  }

  /**
   * Hủy đăng ký một channel
   */
  async unsubscribe(event: string) {
    await this.subscriber.unsubscribe(event)
    logger.info(`Unsubscribed from channel: ${event}`)
  }

  /**
   * Đóng các kết nối
   */
  async shutdown(): Promise<void> {
    try {
      // .quit() đợi các lệnh đang chạy hoàn tất rồi mới đóng
      await Promise.all([this.publisher.quit(), this.subscriber.quit()])
      logger.info('Redis PubSubService shutdown complete')
    } catch (err) {
      logger.error('Error during Redis shutdown:', err)
    }
  }
}

const pubSubServiceInstance = new PubSubService()
export default pubSubServiceInstance
