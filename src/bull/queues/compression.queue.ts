import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './job.conf'

export const compressionQueue = new Queue(CONSTANT_QUEUE.COMPRESSION, {
  connection: redisConnection,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})
