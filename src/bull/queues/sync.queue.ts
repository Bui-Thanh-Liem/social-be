import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'

export const syncQueue = new Queue(CONSTANT_QUEUE.SYNC, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    removeOnFail: true,
    removeOnComplete: true,
    backoff: { type: 'exponential', delay: 1000 }
  }
})
