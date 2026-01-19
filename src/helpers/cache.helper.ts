import { redisCluster } from '~/configs/redis.config'
import { createKeyUserLastSeen, createKeyUserOnline } from '~/utils/create-key-cache.util'
import { logger } from '~/utils/logger.util'

export class CacheService {
  private client = redisCluster
  private defaultTTL: number = 600 // 10 minutes in seconds

  constructor() {
    this.client.on('ready', () => logger.info('Redis Cluster - CacheService is Ready'))
    this.client.on('error', (err) => logger.error('Redis Cluster Error:', err))
  }

  // ioredis tự động quản lý connection nên không cần hàm connect() thủ công

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const storeValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      const expiry = ttl ?? this.defaultTTL

      // ioredis: set(key, value, 'EX', seconds)
      await this.client.set(key, storeValue, 'EX', expiry)
      return true
    } catch (err) {
      logger.error(`Failed to set cache for key ${key}:`, err)
      return false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const rawValue = await this.client.get(key)
      if (rawValue === null) return null
      try {
        return JSON.parse(rawValue) as T
      } catch {
        return rawValue as unknown as T
      }
    } catch (err) {
      logger.error(`Failed to get cache for key ${key}:`, err)
      return null
    }
  }

  // ==========================================
  // Set & List Operations
  // ==========================================

  async sAdd(key: string, member: string): Promise<boolean> {
    const result = await this.client.sadd(key, member)
    return result > 0
  }

  async sRem(key: string, member: string): Promise<boolean> {
    const result = await this.client.srem(key, member)
    return result > 0
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member)
      return result === 1
    } catch (err) {
      logger.error(`Failed to check sIsMember for key ${key}:`, err)
      return false
    }
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.client.smembers(key)
  }

  async lPush(key: string, value: string): Promise<number> {
    return await this.client.lpush(key, value)
  }

  async rPop(key: string): Promise<string | null> {
    return await this.client.rpop(key)
  }

  // ==========================================
  // Hash Operations
  // ==========================================

  async hIncrBy(key: string, field: string, increment: number): Promise<number> {
    return await this.client.hincrby(key, field, increment)
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key)
  }

  // ==========================================
  // Pipeline (Multi trong ioredis)
  // ==========================================

  /**
   * Pipeline trong Cluster chỉ hoạt động nếu các keys nằm trên cùng 1 slot (dùng Hash Tags)
   */
  pipeline() {
    return this.client.pipeline()
  }

  // ==========================================
  // User Status Tracking (Online/Offline)
  // ==========================================

  async markUserOnline(userId: string): Promise<void> {
    // Dùng Hash Tag {user_status} để đảm bảo toàn bộ Set online nằm trên cùng 1 node
    const key = `{user_status}:${createKeyUserOnline()}`
    await this.client.sadd(key, userId)
  }

  async markUserOffline(userId: string): Promise<void> {
    const onlineKey = `{user_status}:${createKeyUserOnline()}`
    const lastSeenKey = `{user_status}:${createKeyUserLastSeen()}`

    // Sử dụng Pipeline để thực hiện 2 lệnh cùng lúc
    await this.client.pipeline().srem(onlineKey, userId).hset(lastSeenKey, userId, Date.now().toString()).exec()
  }

  async areUsersOnline(userIds: string[]): Promise<Record<string, boolean>> {
    if (!userIds.length) return {}
    const key = `{user_status}:${createKeyUserOnline()}`

    // ioredis sử dụng smismember (không viết hoa camelCase như node-redis)
    const results = await this.client.smismember(key, ...userIds)

    return userIds.reduce(
      (acc, userId, idx) => {
        acc[userId] = results[idx] === 1
        return acc
      },
      {} as Record<string, boolean>
    )
  }

  async del(key: string): Promise<boolean> {
    const result = await this.client.del(key)
    return result > 0
  }

  async shutdown(): Promise<void> {
    await this.client.quit()
    logger.info('CacheService shutdown complete')
  }
}

export default new CacheService()
