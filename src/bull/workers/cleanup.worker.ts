import { Worker } from 'bullmq'
import { redisCluster } from '~/configs/redis.config'
import MessagesService from '~/services/Messages.service'
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
      case CONSTANT_JOB.DELETE_MESSAGES: {
        const { conversation_id } = job.data
        await MessagesService.deleteConversationMessages(conversation_id)
        console.log('Deleted messages of conversation ', conversation_id)
        break
      }
      default:
        break
    }
  },
  {
    concurrency: 5,
    connection: redisCluster,
    stalledInterval: 30000, // 30 seconds
    lockDuration: 30000 // 30 seconds
  }
)

cleanupWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
