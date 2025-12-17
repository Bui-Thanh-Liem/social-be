import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './job.conf'

export const cleanupQueue = new Queue(CONSTANT_QUEUE.CLEANUP, {
  connection: redisConnection,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})

// 🔹 Dev / staging / app nhỏ → Multi-worker single process
// 🔹 Production / hệ thống lớn → Dedicated worker process (1 queue = 1 process).
