import { JobProgress, Queue, QueueEvents } from 'bullmq'
import { redisConfig } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { configDefaultJobOptions } from './job.conf'

export const emailQueue = new Queue(CONSTANT_QUEUE.MAIL, {
  connection: redisConfig,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})

const queueEvents = new QueueEvents(CONSTANT_QUEUE.MAIL)

queueEvents.on('completed', (jobId, result) => {
  console.log(`Job ${jobId} completed ${result}`)
})

queueEvents.on('failed', (jobId, failedReason) => {
  console.log(`Job ${jobId} failed ${failedReason}`)
})

queueEvents.on('progress', (e: { jobId: string; data: JobProgress }) => {
  console.log(`Job ${e.jobId} progress: ${e.data}`)
})
