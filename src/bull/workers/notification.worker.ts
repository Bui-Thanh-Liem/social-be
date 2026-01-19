import { Worker } from 'bullmq'
import { ObjectId } from 'mongodb'
import { redisCluster } from '~/configs/redis.config'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import NotificationService from '~/services/Notification.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { CreateNotiCommentDto, CreateNotiDto, CreateNotiLikeDto } from '~/shared/dtos/req/notification.dto'
import { ENotificationType } from '~/shared/enums/type.enum'
import { logger } from '~/utils/logger.util'

export const notificationWorker = new Worker(
  CONSTANT_QUEUE.NOTIFICATION,
  async (job) => {
    //
    switch (job.name) {
      case CONSTANT_JOB.SEND_NOTI: {
        const payload = job.data as CreateNotiDto
        await NotificationService.create(payload)
        console.log('✅ Sent noti ::::', payload)
        break
      }
      case CONSTANT_JOB.SEND_NOTI_LIKE: {
        // Extract data from job
        const { sender_id, tweet_id } = job.data as CreateNotiLikeDto

        // Fetch sender and tweet details
        const [sender, tw] = await Promise.all([
          UserCollection.findOne({ _id: new ObjectId(sender_id) }, { projection: { name: 1 } }),
          TweetCollection.findOne({ _id: new ObjectId(tweet_id) }, { projection: { user_id: 1 } })
        ])

        // Create notification payload
        const payload: CreateNotiDto = {
          content: `${sender?.name} đã thích bài viết của bạn.`,
          type: ENotificationType.Mention_like,
          sender: sender_id,
          receiver: tw!.user_id.toString(),
          ref_id: tw?._id.toString()
        }

        // Send notification
        await NotificationService.create(payload)
        console.log('✅ Sent noti ::::', payload)
        break
      }
      case CONSTANT_JOB.SEND_NOTI_COMMENT: {
        // Extract data from job
        const { sender_id, tweet_id } = job.data as CreateNotiCommentDto

        // Fetch sender and tweet details
        const [sender, tw] = await Promise.all([
          UserCollection.findOne({ _id: new ObjectId(sender_id) }, { projection: { name: 1 } }),
          TweetCollection.findOne({ _id: new ObjectId(tweet_id) }, { projection: { user_id: 1 } })
        ])

        // Create notification payload
        const payload: CreateNotiDto = {
          content: `${sender?.name} đã bình luận bài viết của bạn.`,
          type: ENotificationType.Mention_like,
          sender: sender_id,
          receiver: tw!.user_id.toString(),
          ref_id: tw?._id.toString()
        }

        // Send notification
        await NotificationService.create(payload)
        console.log('✅ Sent noti ::::', payload)
        break
      }
    }
  },
  {
    concurrency: 5,
    connection: redisCluster
  }
)

notificationWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
