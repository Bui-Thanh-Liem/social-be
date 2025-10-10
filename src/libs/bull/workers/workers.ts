import mailServiceInstance from '~/helpers/mail.helper'
import VideosService from '~/services/Videos.service'
import { BadRequestError } from '~/shared/classes/error.class'
import { CONSTANT_JOB } from '~/shared/constants'
import { EVideoStatus } from '~/shared/enums/status.enum'
import ConversationGateway from '~/socket/gateways/Conversation.gateway'
import { compressionVideo } from '~/utils/compression.util'
import { logger } from '~/utils/logger.util'
import { compressionQueue, sendEmailQueue } from '../queues'
import { sendNotiQueue } from '../queues/sendNotiQueue'
import database from '~/configs/database.config'
import { initializeSocket } from '~/socket'

// Worker xử lý gửi email xác thực
sendEmailQueue.process(CONSTANT_JOB.VERIFY_MAIL, 5, async (job, done) => {
  try {
    const { toEmail, name, url } = job.data
    await mailServiceInstance.sendVerifyEmail({ toEmail, name, url })
    logger.info('Sent verify email to', toEmail)
    done()
  } catch (error) {
    console.error(`Verify email failed for ${job.data.toEmail}`, error)
    done(new Error('Verify email failed'))
  }
})

// Worker xử lý gửi email quên mật khẩu
sendEmailQueue.process(CONSTANT_JOB.FORGOT_PASSWORD, 5, async (job, done) => {
  const { toEmail, name, url } = job.data
  try {
    await mailServiceInstance.sendForgotPasswordEmail({ toEmail, name, url })
    logger.info('Sent forgot password email to', toEmail)
    done()
  } catch (error) {
    console.error(`Forgot password email failed for ${toEmail}`, error)
    done(new Error('Forgot password email failed'))
  }
})

// Worker xử lý hls
compressionQueue.process(CONSTANT_JOB.COMPRESSION_HLS, 5, async (job, done) => {
  const { path, _id } = job.data
  try {
    logger.info(`Encoding video - ${path}`)
    await compressionVideo(path)
    logger.info(`Encode video ${path} success`)

    //
    await database.connect()
    database.initialCollections()
    await VideosService.changeStatus(_id.toString(), EVideoStatus.Success)
    // await database.disconnect()  // không dis trong worker , khiến connect cũ expired
    done()
  } catch (error) {
    logger.info('error::', error)
    done(new BadRequestError(`Encode video ${path} error`))
  }
})

// Worker xử lý gửi số lượng thông báo chưa đọc sau khi đăng kí tàì khoản
sendNotiQueue.process(CONSTANT_JOB.UNREAD_NOTI, 5, async (job, done) => {
  try {
    const { user_id } = job.data
    await ConversationGateway.sendCountUnreadConv(user_id)
    logger.info('Sent count noti to', user_id)
    done()
  } catch (error) {
    done(new Error('Send count noti after register failed'))
  }
})
