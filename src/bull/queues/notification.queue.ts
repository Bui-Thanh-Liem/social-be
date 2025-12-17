import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './job.conf'

export const notificationQueue = new Queue(CONSTANT_QUEUE.NOTIFICATION, {
  connection: redisConnection,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})
