import database from '~/configs/database.config'
import { envs } from '~/configs/env.config'
import { logger } from '~/utils/logger.util'
import { inviteQueue } from '../queues'
import { cleanupWorker, compressionWorker, emailWorker, notificationWorker } from './index'

async function bootstrapWorker() {
  try {
    // 1. Kết nối database
    await database.connect()
    logger.info('✅ Worker: Database connected!')

    // 2. Khởi tạo collections (nếu cần)
    database.initialCollections()
    logger.info('✅ Worker: Collections initialized!')

    // 3. Khởi tạo indexes (optional - có thể bỏ qua vì API server đã tạo rồi)
    // await database.initialIndex()

    // 4. Log worker status
    logger.info('🚀 Workers are running...')
    logger.info(`  - Email Worker: ${emailWorker.name}`)
    logger.info(`  - Cleanup Worker: ${cleanupWorker.name}`)
    logger.info(`  - InviteQueue Worker: ${inviteQueue.name}`)
    logger.info(`  - Compression Worker: ${compressionWorker.name}`)
    logger.info(`  - Notification Worker: ${notificationWorker.name}`)

    console.log('=== ENVIRONMENT CHECK ===')
    console.log('REDIS_HOST:', envs.REDIS_HOST)
    console.log('REDIS_PORT:', envs.REDIS_PORT)
    console.log('NODE_ENV:', envs.NODE_ENV)
    console.log('========================')

    // 5. Health check (optional)
    setInterval(async () => {
      const db = database.getDb()
      await db.admin().ping()
    }, 30000) // Ping mỗi 30s
  } catch (err) {
    logger.error('❌ Worker: Failed to start:', err)
    await database.disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('🛑 Worker: Shutting down gracefully...')

  try {
    // 1. Đóng tất cả workers
    await Promise.all([
      cleanupWorker.close(),
      compressionWorker.close(),
      emailWorker.close(),
      notificationWorker.close()
    ])
    logger.info('✅ All workers closed')

    // 2. Đóng database connection
    await database.disconnect()
    logger.info('✅ Database disconnected')

    process.exit(0)
  } catch (err) {
    logger.error('❌ Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Bắt đầu worker
bootstrapWorker()
