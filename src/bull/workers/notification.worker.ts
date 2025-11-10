import { Worker } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import NotificationService from '~/services/Notification.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { CreateNotiDto } from '~/shared/dtos/req/notification.dto'
import { logger } from '~/utils/logger.util'

export const notificationWorker = new Worker(
  CONSTANT_QUEUE.NOTIFICATION,
  async (job) => {
    //
    switch (job.name) {
      case CONSTANT_JOB.SEND_NOTI: {
        const payload = job.data as CreateNotiDto
        await NotificationService.create(payload)
        console.log('✅ Sent noti ::::', payload)
        break
      }
    }
  },
  {
    concurrency: 5,
    connection: redisConnection
  }
)

notificationWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
