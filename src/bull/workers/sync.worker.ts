import { Worker } from 'bullmq'
import { redisConfig } from '~/configs/redis.config'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { logger } from '~/utils/logger.util'
import LikesService from '~/services/Likes.service'
import { log } from 'node:console'

console.log('syncWorker queue - redisConfig :::', redisConfig)

//
export const syncWorker = new Worker(
  CONSTANT_QUEUE.SYNC,
  async (job) => {
    switch (job.name) {
      case CONSTANT_JOB.SYNC_LIKE:
        await LikesService.syncLikesFromCacheToDB()
        console.log(`✅ Synced likes from cache to DB`)
        break
    }
  },
  {
    concurrency: 5,
    connection: redisConfig
  }
)

syncWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
