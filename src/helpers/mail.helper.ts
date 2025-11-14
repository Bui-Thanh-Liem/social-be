import nodemailer from 'nodemailer'
import path from 'path'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.reponse'
import { ISendVerifyEmail } from '~/shared/interfaces/common/mail.interface'
import { logger } from '~/utils/logger.util'

class MailService {
  private transporter
  private from = envs.MAIL_SERVICE_ROOT || ''

  constructor() {
    // Bước 1: Transporter với Gmail (hoặc SMTP khác)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envs.MAIL_SERVICE_USER,
        pass: envs.MAIL_SERVICE_PASS
      }
    })

    // Bước 2: Cài handlebars
    this.setupHandlebars()
  }

  async setupHandlebars() {
    const { default: hbs } = await import('nodemailer-express-handlebars')

    // __dirname sẽ tự động đúng cả dev và prod
    const templatesPath = path.join(__dirname, '../templates')

    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.handlebars',
          partialsDir: templatesPath,
          defaultLayout: false
        },
        viewPath: templatesPath,
        extName: '.handlebars'
      })
    )
  }

  /**
   * Gửi email xác minh tài khoản
   * @param to_email địa chỉ email người nhận
   * @param name tên người nhận
   * @param verifyCode mã xác minh
   */
  async sendVerifyEmail({ to_email, name, url }: ISendVerifyEmail) {
    const mailOptions = {
      from: this.from,
      to: to_email,
      subject: 'Verify your email',
      template: 'verifyEmail',
      context: {
        name,
        url
      }
    }

    //
    try {
      logger.info('✅ Đang gửi email xác minh:', to_email)
      const info = await this.transporter.sendMail(mailOptions)
      logger.info('✅ Đã gửi email xác minh:', info.response)
    } catch (error) {
      console.error('❌ Lỗi gửi email xác minh:', error)
      throw new BadRequestError(error as string)
    }
  }

  /**
   * Gửi email xác minh tài khoản
   * @param to_email địa chỉ email người nhận
   * @param userName tên người nhận
   * @param verifyCode mã xác minh
   */
  async sendForgotPasswordEmail({ to_email, name, url }: ISendVerifyEmail) {
    const _mailOptions = {
      from: this.from,
      to: to_email,
      subject: 'forgot password',
      template: 'forgotPassword',
      context: {
        name,
        url
      }
    }

    //
    try {
      logger.info('✅ Đang gửi email để đặt lại mật khẩu:', to_email)
      const info = await this.transporter.sendMail(_mailOptions)
      logger.info('✅ Đã gửi email để đặt lại mật khẩu:', info.response)
    } catch (error) {
      console.error('❌ Lỗi gửi email để đặt lại mật khẩu:', error)
      throw new BadRequestError(error as string)
    }
  }
}

const mailServiceInstance = new MailService()
export default mailServiceInstance
