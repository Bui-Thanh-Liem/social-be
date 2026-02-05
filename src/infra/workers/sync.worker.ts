import { Worker } from 'bullmq'
import { redisCluster } from '~/configs/redis.config'
import likesService from '~/modules/likes/likes.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { logger } from '~/utils/logger.util'

//
export const syncWorker = new Worker(
  CONSTANT_QUEUE.SYNC,
  async (job) => {
    switch (job.name) {
      case CONSTANT_JOB.SYNC_LIKE:
        await likesService.syncLikesFromCacheToDB()
        console.log(`✅ Synced likes from cache to DB`)
        break
    }
  },
  {
    concurrency: 5,
    connection: redisCluster
  }
)

syncWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
