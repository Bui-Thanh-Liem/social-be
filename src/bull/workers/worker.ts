import { instanceMongodb } from '~/dbs/init.mongodb'
import { logger } from '~/utils/logger.util'
import { inviteQueue } from '../queues'
import { cleanupWorker, compressionWorker, emailWorker, notificationWorker, syncWorker } from './index'

async function bootstrapWorker() {
  try {
    // 1. Kết nối database
    await instanceMongodb.connect()
    logger.info('✅ Worker: Database connected!')

    instanceMongodb.initialCollections()
    logger.info('Cerated collections!')

    instanceMongodb.initialIndex()
    logger.info('Cerated index!')

    // 3. Khởi tạo indexes (optional - có thể bỏ qua vì API server đã tạo rồi)
    // await database.initialIndex()

    // 4. Log worker status
    logger.info('🚀 Workers are running...')
    logger.info(`  - Email Worker: ${emailWorker.name}`)
    logger.info(`  - Cleanup Worker: ${cleanupWorker.name}`)
    logger.info(`  - InviteQueue Worker: ${inviteQueue.name}`)
    logger.info(`  - Sync Worker: ${syncWorker.name}`)
    logger.info(`  - Compression Worker: ${compressionWorker.name}`)
    logger.info(`  - Notification Worker: ${notificationWorker.name}`)
  } catch (err) {
    logger.error('❌ Worker: Failed to start:', err)
    await instanceMongodb.disconnect()
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
      notificationWorker.close(),
      syncWorker.close()
    ])
    logger.info('✅ All workers closed')

    // 2. Đóng database connection
    await instanceMongodb.disconnect()
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
