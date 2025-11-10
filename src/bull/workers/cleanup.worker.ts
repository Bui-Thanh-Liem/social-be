import { Worker } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import TweetsService from '~/services/Tweets.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { logger } from '~/utils/logger.util'

export const cleanupWorker = new Worker(
  CONSTANT_QUEUE.CLEANUP,
  async (job) => {
    //
    switch (job.name) {
      case CONSTANT_JOB.DELETE_CHILDREN_TWEET: {
        const { parent_id } = job.data
        await TweetsService.deleteChildrenTweet(parent_id)
        console.log('Deleted children tweet of ', parent_id)
        break
      }
    }
  },
  {
    concurrency: 5,
    connection: redisConnection
  }
)

cleanupWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
