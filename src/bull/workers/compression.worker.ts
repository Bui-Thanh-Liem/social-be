import { Worker } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { publishCompression } from '~/pubsub/publisher'
import { CONSTANT_QUEUE } from '~/shared/constants'
import { compressionVideo } from '~/utils/compression.util'
import { logger } from '~/utils/logger.util'

export const compressionWorker = new Worker(
  CONSTANT_QUEUE.COMPRESSION,
  async (job) => {
    const { path, _id } = job.data
    logger.info(`Encoding video - ${path}`)
    await compressionVideo(path)
    logger.info(`Encode video ${path} success`)

    // Khi chuyển đổi xong, publish vào redis -> server.js subscribe
    // Chuyển đổi trạng thái video, gửi thông báo client
    await publishCompression(_id.toString())
  },
  { connection: redisConnection, concurrency: 5 }
)

compressionWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
