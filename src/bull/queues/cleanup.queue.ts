import { JobProgress, Queue, QueueEvents } from 'bullmq'
import { redisConfig } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './config-job'

export const cleanupQueue = new Queue(CONSTANT_QUEUE.CLEANUP, {
  connection: redisConfig,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})

const queueEvents = new QueueEvents(CONSTANT_QUEUE.CLEANUP, {
  connection: redisConfig
})

queueEvents.on('completed', (jobId, result) => {
  console.log(`Job ${JSON.stringify(jobId)} completed ${result}`)
})

queueEvents.on('failed', (jobId, failedReason) => {
  console.log(`Job ${JSON.stringify(jobId)} failed ${failedReason}`)
})

queueEvents.on('progress', (e: { jobId: string; data: JobProgress }) => {
  console.log(`Job ${e.jobId} progress: ${e.data}`)
})
