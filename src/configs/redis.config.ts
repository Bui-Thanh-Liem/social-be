import Redis, { ClusterOptions } from 'ioredis'
import { envs } from './env.config'

const redisClusterOptionsProd: ClusterOptions = {
  // KHÔNG dùng natMap ở đây nữa
  dnsLookup: (address, callback) => callback(null, address),
  redisOptions: {
    tls: {}, // Bắt buộc phải có nếu ElastiCache bật Encryption in-transit
    username: process.env.REDIS_USERNAME, // Nếu có đặt username
    password: process.env.REDIS_PASSWORD, // Nếu có đặt Auth Token
    connectTimeout: 10000
  },
  // AWS thỉnh thoảng bảo trì node, cấu hình này giúp tự động cập nhật danh sách node mới
  slotsRefreshTimeout: 2000
}

const redisClusterOptionsDev: ClusterOptions = {
  redisOptions: {
    showFriendlyErrorStack: true,
    enableReadyCheck: true,
    connectTimeout: 10000,
    tls: {}
  },
  // ioredis sẽ tự động gọi natMap khi nhận được phản hồi MOVED từ Redis Cluster
  natMap: (address: string) => {
    const [ip, port] = address.split(':')
    const match = ip.match(/172\.\d+\.0\.(\d+)/) // Match cả 172.18, 172.19, v.v.

    if (match) {
      const lastOctet = parseInt(match[1])

      // Công thức ánh xạ dựa trên Compose của bạn:
      // .2 (redis-1) => 6371
      // .5 (redis-4) => 6374
      const mappedPort = 6371 + (lastOctet - 2)

      console.log(`[REDIS-CLUSTER] Map nội bộ ${address} thành localhost:${mappedPort}`)

      return { host: '127.0.0.1', port: mappedPort }
    }
    return null
  }
}

const redisCluster = new Redis.Cluster(
  [
    { host: envs.REDIS_HOST, port: Number(envs.REDIS_PORT) }, // 6371
    { host: envs.REDIS_HOST, port: Number(envs.REDIS_PORT) + 1 } // 6372
  ],
  {
    ...(envs.NODE_ENV === 'production' ? redisClusterOptionsProd : redisClusterOptionsDev)
  }
)

export { redisCluster }
