import { Worker } from 'bullmq'
import { bullRedisOptions } from '~/configs/redis.config'
import { handleNewsFeedForUsers } from '~/services/public/tweets/helpers/handle-news-feed-for-users.helper'
import tweetsService from '~/services/public/tweets/tweets.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants/queue.constant'
import { IHandleNewsFeedType } from '~/shared/interfaces/common/handle-news-feed.interface'
import { logger } from '~/utils/logger.util'

//
export const tweetWorker = new Worker(
  CONSTANT_QUEUE.TWEET,
  async (job) => {
    switch (job.name) {
      case CONSTANT_JOB.HANDLE_NEWS_FEED: {
        const payload = job.data as IHandleNewsFeedType
        await handleNewsFeedForUsers(payload)
        console.log('✅ Handled news feed ::::', payload)
        break
      }

      case CONSTANT_JOB.DELETE_CHILDREN_TWEET: {
        const { parent_id } = job.data
        await tweetsService.deleteChildrenTweet(parent_id)
        console.log('Deleted children tweet of ', parent_id)
        break
      }
    }
  },
  {
    concurrency: 5,
    connection: bullRedisOptions
  }
)

tweetWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
