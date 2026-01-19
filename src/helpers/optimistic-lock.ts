import { redisCluster } from '~/configs/redis.config' // ioredis instance
import { logger } from '~/utils/logger.util'

interface OptimisticValue<T> {
  data: T
  version: number
}

class OptimisticLockService {
  // ioredis Cluster tự động quản lý việc kết nối và reconnect nội bộ
  private client = redisCluster

  constructor() {
    this.client.on('ready', () => logger.info('Redis Cluster - OptimisticLock is Ready'))
    this.client.on('error', (err) => logger.error('Redis Cluster Error', err))
  }

  /**
   * Khởi tạo dữ liệu ban đầu
   */
  async init<T>(key: string, data: T, ttl?: number) {
    const value: OptimisticValue<T> = { data, version: 1 }
    const payload = JSON.stringify(value)

    if (ttl) {
      // ioredis dùng tham số trực tiếp cho TTL: 'PX' (milliseconds) hoặc 'EX' (seconds)
      await this.client.set(key, payload, 'PX', ttl)
    } else {
      await this.client.set(key, payload)
    }
  }

  /**
   * Lấy dữ liệu kèm version
   */
  async get<T>(key: string): Promise<OptimisticValue<T> | null> {
    const value = await this.client.get(key)
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch (e) {
      logger.error('JSON Parse Error in Redis Get', e)
      return null
    }
  }

  /**
   * Cập nhật sử dụng Lua Script (Atomic Compare-and-Set)
   */
  async set<T>(key: string, newData: T, expectedVersion: number, ttl?: number): Promise<boolean> {
    const newValue: OptimisticValue<T> = {
      data: newData,
      version: expectedVersion + 1
    }

    /**
     * LƯU Ý ioredis cú pháp EVAL:
     * .eval(script, numKeys, key1, key2..., arg1, arg2...)
     */
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
      const result = await this.client.eval(
        luaScript,
        1, // Số lượng keys
        key, // KEYS[1]
        expectedVersion.toString(), // ARGV[1]
        JSON.stringify(newValue), // ARGV[2]
        ttl ? ttl.toString() : '0' // ARGV[3]
      )

      return result === 1
    } catch (err: any) {
      // Nếu là lỗi MOVED, ioredis sẽ tự động retry
      // trừ khi NAT mapping config sai
      logger.error('Optimistic Lock Lua Error', err)
      return false
    }
  }
}

export default new OptimisticLockService()
