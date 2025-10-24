import Queue from 'bull'
import { envs } from '~/configs/env.config'
import { CONSTANT_QUEUE } from '~/shared/constants'

export const sendNotiRegisteredQueue = new Queue(CONSTANT_QUEUE.SEND_NOTI, {
  redis: { host: envs.REDIS_HOST, port: envs.REDIS_PORT },
  defaultJobOptions: {
    attempts: 2, // Thử lại tối đa 2 lần
    backoff: { type: 'exponential', delay: 1000 }, // Delay tăng dần
    removeOnComplete: true,
    removeOnFail: true,
    delay: 5000
  }
})
