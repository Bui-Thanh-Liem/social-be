import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app'
import { envs } from './configs/env.config'
import { instanceMongodb } from './database/mongodb.db'
import { initSubscriber } from './pubsub/subscriber'
import { allowedOrigins } from './middlewares/cors.middleware'
import { initializeSocket } from './socket'

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
    // 1. Kết nối DB cơ bản (Phải có để App chạy)
    await instanceMongodb.connect()
    console.log('Database connected!')

    // 2. MỞ CỔNG SERVER NGAY LẬP TỨC 🚀
    // Việc này giúp ALB check-health thành công ngay khi container vừa up
    httpServer.listen(port, host, () => {
      console.log(`✅ App listening on ${host}:${port}`)
    })

    // 3. Khởi tạo các thành phần chạy ngầm (Không dùng await để không chặn luồng chính)
    instanceMongodb.initialCollections()

    // Khởi tạo Index (chạy ngầm, nếu lỗi cũng không sập app)
    instanceMongodb.initialIndex().catch((err) => {
      console.error('❌ MongoDB Indexing failed:', err)
    })

    // Khởi tạo Redis (chạy ngầm)
    initSubscriber()
      .then(() => {
        console.log('✅ Redis PubSub initialized!')
      })
      .catch((redisErr) => {
        console.error('❌ Redis Sub error:', redisErr)
      })

    // Khởi tạo Socket.IO
    initializeSocket(io)
    console.log('✅ Socket.IO initialized!')
  } catch (err) {
    console.error('💥 Bootstrap failed:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    console.log('Process terminated')
  })
})

bootstrap()
