import { createCluster, RedisClusterType, SetOptions } from 'redis'
import { redisConfig } from '~/configs/redis.config'
import { createKeyUserLastSeen, createKeyUserOnline } from '~/utils/create-key-cache.util'
import { logger } from '~/utils/logger.util'

export class CacheService {
  private client: RedisClusterType
  private defaultTTL: number = 600 // 10 minutes in seconds

  constructor() {
    this.client = createCluster({
      rootNodes: [
        {
          url: `rediss://${redisConfig.host}:${redisConfig.port}`
        }
      ],
      defaults: {
        socket: {
          tls: true,
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
        }
      }
    })

    this.client.on('error', (err) => console.error('Redis Client Error:', err))
    if (!this.client.isOpen)
      this.client.on('connect', () => {
        logger.info('Redis Client Connected')
      })
    this.client.on('end', () => {
      logger.info('Redis Client Disconnected')
    })

    // Connect immediately
    // this.connect()
  }

  private async connect(): Promise<void> {
    // Sửa lỗi: Chỉ kết nối nếu client chưa mở
    if (!this.client.isOpen) {
      try {
        await this.client.connect()
      } catch (err) {
        // Nếu lỗi do socket đã mở thì bỏ qua, ngược lại thì throw
        if (!(err instanceof Error && err.message.includes('Socket already opened'))) {
          throw err
        }
      }
    }
  }

  async set<T>(key: string, value: T, options?: SetOptions & { ttl?: number }): Promise<boolean> {
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

  async sAdd(key: string, member: string): Promise<boolean> {
    await this.connect()
    try {
      const result = await this.client.sAdd(key, member)
      return result === 1
    } catch (err) {
      console.error(`Failed to add member to set for key ${key}:`, err)
      return false
    }
  }

  async sRem(key: string, member: string): Promise<boolean> {
    await this.connect()
    try {
      const result = await this.client.sRem(key, member)
      return result === 1
    } catch (err) {
      console.error(`Failed to remove member from set for key ${key}:`, err)
      return false
    }
  }

  async sMembers(key: string): Promise<string[]> {
    await this.connect()
    try {
      const members = await this.client.sMembers(key)
      return members
    } catch (err) {
      console.error(`Failed to get members of set for key ${key}:`, err)
      return []
    }
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    await this.connect()
    try {
      const isMember = await this.client.sIsMember(key, member)
      return isMember === 1
    } catch (err) {
      console.error(`Failed to check membership in set for key ${key}:`, err)
      return false
    }
  }

  async lPush(key: string, value: string): Promise<boolean> {
    await this.connect()
    try {
      await this.client.lPush(key, value)
      return true
    } catch (err) {
      console.error(`Failed to push value to list for key ${key}:`, err)
      return false
    }
  }

  async rPop(key: string): Promise<string | null> {
    await this.connect()
    try {
      const value = await this.client.rPop(key)
      return value
    } catch (err) {
      console.error(`Failed to pop value from list for key ${key}:`, err)
      return null
    }
  }

  async hIncrBy(key: string, field: string, increment: number): Promise<number | null> {
    await this.connect()
    try {
      const result = await this.client.hIncrBy(key, field, increment)
      return result
    } catch (err) {
      console.error(`Failed to increment hash field ${field} for key ${key}:`, err)
      return null
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    await this.connect()
    try {
      const result = await this.client.hGet(key, field)
      return result
    } catch (err) {
      console.error(`Failed to get hash field ${field} for key ${key}:`, err)
      return null
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    await this.connect()
    try {
      const result = await this.client.hGetAll(key)
      return result
    } catch (err) {
      console.error(`Failed to get all hash fields for key ${key}:`, err)
      return {}
    }
  }

  async get<T>(key: string): Promise<T | null> {
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

  async exists(key: string): Promise<boolean> {
    await this.connect()

    try {
      const exists = await this.client.exists(key)
      return exists === 1
    } catch (err) {
      console.error(`Failed to check existence of key ${key}:`, err)
      return false
    }
  }

  async pipeline(): Promise<ReturnType<RedisClusterType['multi']>> {
    await this.connect()
    return this.client.multi()
  }

  async execPipeline(pipe: ReturnType<RedisClusterType['multi']>) {
    return await pipe.exec()
  }

  // Graceful disconnect
  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      try {
        await this.client.quit()
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

  // ==========================================
  // User Online/Offline Tracking Methods
  // ==========================================

  /**
   * Đánh dấu user online (thêm vào Redis Set)
   */
  async markUserOnline(userId: string): Promise<void> {
    await this.connect()
    await this.client.sAdd(createKeyUserOnline(), userId)
  }

  /**
   * Đánh dấu user offline (xóa khỏi online set, lưu lastSeen)
   */
  async markUserOffline(userId: string): Promise<void> {
    await this.connect()
    await this.client.sRem(createKeyUserOnline(), userId)
    await this.client.hSet(createKeyUserLastSeen(), userId, Date.now().toString())
  }

  /**
   * Kiểm tra user có đang online không
   */
  async isUserOnline(userId: string): Promise<boolean> {
    await this.connect()
    return (await this.client.sIsMember(createKeyUserOnline(), userId)) === 1
  }

  /**
   * Kiểm tra nhiều users có đang online không (dùng Redis SMISMEMBER)
   */
  async areUsersOnline(userIds: string[]): Promise<Record<string, boolean>> {
    if (!userIds || userIds.length === 0) return {}

    await this.connect()
    const key = createKeyUserOnline()

    // smIsMember (số nhiều) nhận: (key, [member1, member2, ...])
    // Trả về mảng boolean[]
    const results = await this.client.smIsMember(key, userIds)

    return userIds.reduce(
      (acc, userId, idx) => {
        // Ép kiểu number (0, 1) sang boolean (false, true)
        acc[userId] = results[idx] === 1
        return acc
      },
      {} as Record<string, boolean>
    )
  }

  /**
   * Lấy lastSeen của user
   */
  async getUserLastSeen(userId: string): Promise<Date | null> {
    await this.connect()
    const ts = await this.client.hGet(createKeyUserLastSeen(), userId)
    return ts ? new Date(Number(ts)) : null
  }

  /**
   * Lấy toàn bộ user đang online (cẩn thận performance nếu >100k)
   */
  async getAllOnlineUsers(): Promise<string[]> {
    await this.connect()
    return await this.client.sMembers(createKeyUserOnline())
  }
}

// Singleton instance
const cacheService = new CacheService()
export default cacheService
