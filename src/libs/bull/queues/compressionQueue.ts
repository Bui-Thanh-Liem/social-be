import Queue from 'bull'
import { envs } from '~/configs/env.config'
import { CONSTANT_QUEUE } from '~/shared/constants'

export const compressionQueue = new Queue(CONSTANT_QUEUE.COMPRESSION, {
  redis: { host: envs.REDIS_HOST, port: envs.REDIS_PORT },
  defaultJobOptions: {
    attempts: 3, // Thử lại tối đa 3 lần
    backoff: { type: 'exponential', delay: 1000 }, // Delay tăng dần
    removeOnComplete: true,
    removeOnFail: false
  }
})
