import { Worker } from 'bullmq'
import { redisCluster } from '~/configs/redis.config'
import mailServiceInstance from '~/helpers/mail.helper'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { logger } from '~/utils/logger.util'

// Worker xử lý gửi email xác thực
// Worker xử lý gửi email quên mật khẩu
export const emailWorker = new Worker(
  CONSTANT_QUEUE.MAIL,
  async (job) => {
    const { to_email, name, url } = job.data
    switch (job.name) {
      case CONSTANT_JOB.VERIFY_MAIL:
        await mailServiceInstance.sendVerifyEmail({ to_email, name, url })
        console.log(`✅ Sent verify email to ${to_email}`)
        break

      case CONSTANT_JOB.FORGOT_PASSWORD:
        await mailServiceInstance.sendForgotPasswordEmail({ to_email, name, url })
        console.log('Sent forgot password email to', to_email)
        break
    }
  },
  {
    concurrency: 5,
    connection: redisCluster
  }
)

emailWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
