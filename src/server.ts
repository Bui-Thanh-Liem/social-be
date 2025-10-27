import { createServer } from 'http'
import { Server } from 'socket.io'
import database from '~/configs/database.config'
import app from './app'
import { envs } from './configs/env.config'
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
    await database.connect()
    logger.info('Database connected!')

    database.initialCollections()
    logger.info('Cerated collections!')

    database.initialIndex()
    logger.info('Cerated index!')

    initializeSocket(io)
    logger.info('Socket.IO initialized!')

    // Subscribe từ redis
    await initSubscriber()

    //
    httpServer.listen(port, host, () => {
      logger.info(`App listening on ${host}:${port}`)
    })
  } catch (err) {
    await database.disconnect()
    logger.error('Failed to connect database:', err)
    process.exit(1) // dừng app nếu không connect được
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
