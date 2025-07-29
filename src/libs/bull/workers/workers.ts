import { CONSTANT_JOB } from '~/shared/constants'
import mailServiceInstance from '~/helpers/mail.helper'
import VideosService from '~/services/Videos.service'
import { BadRequestError } from '~/shared/classes/error.class'
import { EVideoStatus } from '~/shared/enums/status.enum'
import { compressionVideo } from '~/utils/compression.util'
import { compressionQueue, sendEmailQueue } from '../queues'

// Worker xử lý gửi email xác thực
sendEmailQueue.process(CONSTANT_JOB.VERIFY_MAIL, 5, async (job, done) => {
  try {
    const { toEmail, name, url } = job.data
    await mailServiceInstance.sendVerifyEmail({ toEmail, name, url })
    console.log('Sent verify email to', toEmail)
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
    console.log('Sent forgot password email to', toEmail)
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
    console.log(`Encoding video - ${path}`)
    await compressionVideo(path)
    console.log(`Encode video ${path} success`)
    await VideosService.changeStatus(_id.toString(), EVideoStatus.Success)
    done()
  } catch (error) {
    console.log('error::', error)
    done(new BadRequestError(`Encode video ${path} error`))
  }
})
