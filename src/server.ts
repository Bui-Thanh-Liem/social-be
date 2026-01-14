import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app'
import { envs } from './configs/env.config'
import { instanceMongodb } from './dbs/init.mongodb'
import { allowedOrigins } from './middlewares/cors.middleware'
import { initSubscriber } from './pubsub/subscriber'
import { initializeSocket } from './socket'
import { logger } from './utils/logger.util'

//
const port = envs.SERVER_PORT
const host = envs.SERVER_HOST

const httpServer = createServer(app)

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000, // Thời gian chờ PONG là 60s => disconnect
  pingInterval: 25000, // Khoảng thời gian server gửi ping tới client để giữ kết nố, mỗi 25s server sẽ ping một lần.
  maxHttpBufferSize: 1e6 // kích thước gói tin (payload) client gửi lên. (1mb)
})

//
async function bootstrap() {
  try {
    // 1. Kết nối DB trước
    await instanceMongodb.connect()
    logger.info('Database connected!')

    // 2. Khởi tạo data
    instanceMongodb.initialCollections()
    instanceMongodb.initialIndex()

    // 3. Khởi tạo Socket và Redis (Nên bọc try catch riêng cho Redis)
    initializeSocket(io)

    try {
      await initSubscriber()
      logger.info('Redis PubSub initialized!')
    } catch (redisErr) {
      logger.error('Redis failing but continuing server...', redisErr)
      // Tùy bạn muốn dừng app hay chạy tiếp nếu Redis lỗi
    }

    httpServer.listen(port, host, () => {
      logger.info(`App listening on ${host}:${port}`)
    })
  } catch (err) {
    logger.error('Bootstrap failed:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Process terminated')
  })
})

bootstrap()
