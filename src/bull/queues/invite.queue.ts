import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './job.conf'

export const inviteQueue = new Queue(CONSTANT_QUEUE.INVITE, {
  connection: redisConnection,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})
