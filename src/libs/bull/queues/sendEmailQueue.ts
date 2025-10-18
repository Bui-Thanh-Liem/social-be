import Queue from 'bull'
import { envs } from '~/configs/env.config'
import { CONSTANT_QUEUE } from '~/shared/constants'

export const sendEmailQueue = new Queue(CONSTANT_QUEUE.SEND_MAIL, {
  redis: { host: envs.REDIS_HOST, port: envs.REDIS_PORT },
  defaultJobOptions: {
    attempts: 3, // Thử lại tối đa 3 lần
    backoff: { type: 'exponential', delay: 1000 }, // Delay tăng dần
    removeOnComplete: true,
    removeOnFail: true
  }
})
