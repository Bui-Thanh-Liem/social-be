import { instanceMongodb } from '~/database/mongodb.db'
import { logger } from '~/utils/logger.util'
import { emailWorker } from './email.worker'
import { inviteWorker } from './invite.worker'
import { notificationWorker } from './notification.worker'
import { systemWorker } from './system.worker'

async function bootstrapWorker() {
  try {
    // 1. Kết nối database
    await instanceMongodb.connect()
    logger.info('✅ Worker: Database connected!')

    // 2. Khởi tạo collections nếu chưa có
    await instanceMongodb.initialCollections()
    logger.info('✅ Worker: Collections are ready!')

    // 3. Log worker status
    logger.info('🚀 Workers are running...')
    logger.info(`  - System Worker: ${systemWorker.name}`)
    logger.info(`  - Email Worker: ${emailWorker.name}`)
    logger.info(`  - Invite Worker: ${inviteWorker.name}`)
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
    await Promise.all([systemWorker.close(), emailWorker.close(), inviteWorker.close(), notificationWorker.close()])
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
