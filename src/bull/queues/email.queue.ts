import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './job.conf'

export const emailQueue = new Queue(CONSTANT_QUEUE.MAIL, {
  connection: redisConnection,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})
