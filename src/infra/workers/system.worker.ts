import { Worker } from 'bullmq'
import { bullRedisOptions } from '~/configs/redis.config'
import likesService from '~/services/public/likes.service'
import MessagesService from '~/services/public/messages.service'
import NotificationsService from '~/services/public/notifications.service'
import reportTweetService from '~/services/public/report-tweets.service'
import TrendingService from '~/services/public/trending.service'
import TweetsService from '~/services/public/tweets/tweets.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants/queue.constant'
import telegram from '~/telegram'
import { logger } from '~/utils/logger.util'
import { startMockTweets } from '~/utils/mock-data.util'

//
export const systemWorker = new Worker(
  CONSTANT_QUEUE.SYSTEM,
  async (job) => {
    console.log('Processing job:', job.name)
    switch (job.name) {
      case CONSTANT_JOB.SYNC_LIKE: {
        await likesService.syncLikesFromCacheToDB()
        console.log(`✅ Synced likes from cache to DB`)
        break
      }
      case CONSTANT_JOB.DELETE_CHILDREN_TWEET: {
        const { parent_id } = job.data
        await TweetsService.deleteChildrenTweet(parent_id)
        console.log('Deleted children tweet of ', parent_id)
        break
      }
      case CONSTANT_JOB.DELETE_TWEET_REPORT: {
        await reportTweetService.checkTweet()
        console.log('Checked reported tweets')
        break
      }
      case CONSTANT_JOB.CLEANUP_OLD_TRENDING: {
        await TrendingService.cleanupOldTrending()
        console.log('Cleaned up old trending')
        break
      }
      case CONSTANT_JOB.CLEANUP_WEAK_TRENDING: {
        await TrendingService.cleanupWeakTrending()
        console.log('Cleaned up weak trending')
        break
      }
      case CONSTANT_JOB.CLEANUP_OLD_NOTIFICATIONS: {
        await NotificationsService.cleanupOldNotifications()
        console.log('Cleaned up old notifications')
        break
      }
      case CONSTANT_JOB.DELETE_MESSAGES: {
        const { conversation_id } = job.data
        await MessagesService.deleteConversationMessages(conversation_id)
        console.log('Deleted messages of conversation ', conversation_id)
        break
      }
      case CONSTANT_JOB.MOCK_DATA: {
        await startMockTweets()
        await telegram.sendAlert(`🚨 <b>Thông báo từ hệ thống:</b> Đã tạo xong 1 tweets mới cho mỗi user!`)
        console.log('Created mock tweets')
        break
      }
      default:
        break
    }
  },
  {
    concurrency: 5,
    connection: bullRedisOptions,
    stalledInterval: 30000, // 30 seconds
    lockDuration: 30000 // 30 seconds
  }
)

systemWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
