import { redisCluster } from '~/configs/redis.config'
import { logger } from '~/utils/logger.util'

class PessimisticLockService {
  private client = redisCluster

  constructor() {
    this.client.on('ready', () => logger.info('Redis Cluster - PessimisticLock is Ready'))
  }

  /**
   * Chiếm khóa (Acquire Lock)
   * @param key Tên khóa
   * @param value Giá trị duy nhất (thường là requestID hoặc userID)
   * @param ttl Thời gian sống của khóa (ms)
   * @returns boolean (true nếu chiếm được khóa)
   */
  async acquire(key: string, value: string, ttl: number): Promise<boolean> {
    // NX: Chỉ set nếu chưa tồn tại
    // PX: Thời gian hết hạn tính bằng miliseconds
    const result = await this.client.set(key, value, 'PX', ttl, 'NX')
    return result === 'OK'
  }

  /**
   * Giải phóng khóa an toàn (Safe Release)
   * Chỉ xóa khóa nếu giá trị bên trong khớp với giá trị lúc chiếm khóa
   */
  async release(key: string, value: string): Promise<boolean> {
    // Lua script đảm bảo tính nguyên tử: Check-then-Delete
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `

    try {
      const result = await this.client.eval(luaScript, 1, key, value)
      return result === 1
    } catch (err) {
      logger.error('Pessimistic Lock Release Error', err)
      return false
    }
  }

  /**
   * Kiểm tra xem khóa có đang tồn tại không
   */
  async isLocked(key: string): Promise<boolean> {
    const val = await this.client.get(key)
    return val !== null
  }
}

const pessimisticLockServiceInstance = new PessimisticLockService()
export default pessimisticLockServiceInstance
