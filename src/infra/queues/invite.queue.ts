import { JobProgress, Queue, QueueEvents } from 'bullmq'
import { bullRedisOptions } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants/queue.constant'
import { configDefaultJobOptions } from '../../configs/default-job.config'

export const inviteQueue = new Queue(CONSTANT_QUEUE.INVITE, {
  connection: bullRedisOptions,
  defaultJobOptions: {
    ...configDefaultJobOptions
  }
})

const queueEvents = new QueueEvents(CONSTANT_QUEUE.INVITE, {
  connection: bullRedisOptions
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
