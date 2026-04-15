import nodemailer from 'nodemailer'
import path from 'path'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.response'
import { ISendVerifyEmail } from '~/shared/interfaces/common/mail.interface'
import { logger } from '~/utils/logger.util'

class MailHelper {
  private static instance: MailHelper
  private transporter: nodemailer.Transporter
  private readonly from: string = envs.MAIL_SERVICE_ROOT || ''
  private isTemplateReady: boolean = false

  private constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Hoặc SMTP config
      auth: {
        user: envs.MAIL_SERVICE_USER,
        pass: envs.MAIL_SERVICE_PASS
      }
    })
    // Không gọi async setup trong constructor
  }

  /**
   * @desc Sử dụng Singleton Pattern để đảm bảo chỉ có một instance của MailHelper trong toàn bộ ứng dụng
   */
  public static getInstance(): MailHelper {
    if (!MailHelper.instance) {
      MailHelper.instance = new MailHelper()
    }
    return MailHelper.instance
  }

  /**
   * @desc Hàm khởi tạo engine template (Handlebars), tách riêng để có thể gọi lại khi cần thiết (nếu quên gọi ở server.ts)
   */
  public async init() {
    if (this.isTemplateReady) return

    const { default: hbs } = await import('nodemailer-express-handlebars')
    const templatesPath = path.resolve(process.cwd(), 'src/templates') // Dùng process.cwd() an toàn hơn

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
    this.isTemplateReady = true
    logger.info('📧 Mail Template Engine initialized')
  }

  /**
   * @desc Hàm gửi email chung, các hàm gửi email cụ thể sẽ gọi lại hàm này với options tương ứng. Nếu template chưa sẵn sàng, sẽ tự động gọi init() để thiết lập.
   */
  private async send(options: any) {
    if (!this.isTemplateReady) {
      await this.init() // Fallback nếu quên gọi init() ở server.ts
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        ...options
      })
      logger.info(`✅ Email sent: ${info.messageId}`)
      return info
    } catch (error: any) {
      logger.error('❌ Mail Service Error:', error)
      throw new BadRequestError(error.message || 'Lỗi gửi email')
    }
  }

  /**
   * @desc Hàm gửi email xác minh tài khoản, nhận vào email người nhận, tên và URL xác minh. Các hàm gửi email khác (như quên mật khẩu) cũng sẽ có cấu trúc tương tự, chỉ khác template và subject.
   */
  async sendVerifyEmail({ to_email, name, url }: ISendVerifyEmail) {
    return this.send({
      to: to_email,
      subject: 'Xác minh tài khoản của bạn',
      template: 'verifyEmail',
      context: { name, url }
    })
  }

  /**
   * @desc Hàm gửi email đặt lại mật khẩu, nhận vào email người nhận, tên và URL đặt lại mật khẩu. Cấu trúc tương tự hàm gửi email xác minh, chỉ khác template và subject.
   */
  async sendForgotPasswordEmail({ to_email, name, url }: ISendVerifyEmail) {
    return this.send({
      to: to_email,
      subject: 'Đặt lại mật khẩu',
      template: 'forgotPassword',
      context: { name, url }
    })
  }
}

export default MailHelper.getInstance()
