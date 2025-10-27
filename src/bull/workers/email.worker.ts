import { Worker } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import mailServiceInstance from '~/helpers/mail.helper'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { logger } from '~/utils/logger.util'


// Worker xử lý gửi email xác thực
// Worker xử lý gửi email quên mật khẩu
export const emailWorker = new Worker(
  CONSTANT_QUEUE.MAIL,
  async (job) => {
    const { toEmail, name, url } = job.data
    switch (job.name) {
      case CONSTANT_JOB.VERIFY_MAIL:
        await mailServiceInstance.sendVerifyEmail({ toEmail, name, url })
        logger.info(`✅ Sent verify email to ${toEmail}`)
        break

      case CONSTANT_JOB.FORGOT_PASSWORD:
        await mailServiceInstance.sendForgotPasswordEmail({ toEmail, name, url })
        logger.info('Sent forgot password email to', toEmail)
        break
    }
  },
  {
    concurrency: 5,
    connection: redisConnection
  }
)

emailWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
