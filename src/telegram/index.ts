import { Telegraf, Markup, Context } from 'telegraf'
import { message } from 'telegraf/filters'
import fs from 'fs'
import { envs } from '~/configs/env.config'
import { authTelegramMiddleware } from './middlewares/auth.middleware'
import { approveAction } from './actions'
import { CallbackQuery, Update } from 'telegraf/types'
import { tweetAcceptAction, tweetRejectAction, tweetRetryAction } from './actions/tweet.action'
import { handleDocumentHandler, handlePhotoHandler } from './handlers'
import { errorHear } from './hears'
import { checkCommand } from './commands/check.command'
import { tweetCommand } from './commands/tweet.command'
import { locationCommand } from './commands/location.command'
import { newChatMembersHandler } from './handlers/new-chat-members.handler'

export type UpdateAction = Context<Update.CallbackQueryUpdate<CallbackQuery>> &
  Omit<Context<Update>, keyof Context<Update>> & {
    match: RegExpExecArray
  }

class Telegram {
  private static instance: Telegram
  private bot: Telegraf
  private readonly chatId: string

  private constructor() {
    this.bot = new Telegraf(envs.TELEGRAM_BOT_TOKEN)
    this.chatId = envs.TELEGRAM_CHAT_ID
    this.registerHandlers()
  }

  /**
   * @desc Sử dụng Singleton Pattern để đảm bảo chỉ có một instance của Telegram trong toàn bộ ứng dụng
   * @returns Telegram - Instance duy nhất của Telegram
   */
  public static getInstance(): Telegram {
    if (!Telegram.instance) {
      Telegram.instance = new Telegram()
    }
    return Telegram.instance
  }

  /**
   * @desc Khởi động Bot Telegram và thiết lập các signal để dừng bot một cách an toàn khi ứng dụng tắt
   */
  public start(): void {
    // Thêm log ở đây để chắc chắn hàm đã được gọi
    console.log('🤖 Telegram Bot: Starting launch process...')

    this.bot
      .launch()
      .then(() => {
        // Dùng logger của project để log đồng bộ màu sắc/thời gian
        console.log('✅ Telegram Bot is running and listening for messages')
      })
      .catch((err) => {
        console.error('❌ Telegram Bot failed to start:', err)
      })
  }

  /**
   * @desc Gửi thông báo văn bản (HTML)
   * @param text - Nội dung thông báo
   * @param targetId - ID của chat mục tiêu (nếu không có sẽ gửi đến chatId mặc định)
   */
  async sendAlert(text: string, targetId?: string) {
    try {
      await this.bot.telegram.sendMessage(targetId || this.chatId, text, { parse_mode: 'HTML' })
    } catch (error) {
      console.error('Send Alert Error:', error)
    }
  }

  /**
   * @desc Gửi file/tài liệu (Dùng stream có sẵn của Telegraf)
   * @param filePath - Đường dẫn đến file cần gửi
   * @param caption - Chú thích cho file
   */
  async sendDocument(filePath: string, caption?: string) {
    try {
      if (!fs.existsSync(filePath)) return
      await this.bot.telegram.sendDocument(this.chatId, { source: filePath }, { caption, parse_mode: 'HTML' })
    } catch (error) {
      console.error('Send Document Error:', error)
    }
  }

  /**
   * @desc Gửi yêu cầu duyệt (Nút bấm)
   * @param requestId - ID của yêu cầu
   * @param amount - Số tiền yêu cầu
   */
  async sendPendingRequest(requestId: string, amount: number) {
    const msg = `🚀 <b>YÊU CẦU RÚT TIỀN</b>\nID: <code>${requestId}</code>\nSố tiền: ${amount.toLocaleString()}đ`
    await this.bot.telegram.sendMessage(this.chatId, msg, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Duyệt', `approve_${requestId}`),
          Markup.button.callback('❌ Từ chối', `reject_${requestId}`)
        ]
      ])
    })
  }

  /**
   * @desc Đăng ký các handler cho các sự kiện từ Bot
   */
  private registerHandlers() {
    // Middleware auth để chỉ cho phép user có ID trong env truy cập bot
    this.bot.use(authTelegramMiddleware)

    // Xử lý nút bấm
    this.bot.action(/approve_(.+)/, approveAction)

    // Xử lý nút "Chấp nhận" trong lệnh /tweet
    this.bot.action('tweet_accept', tweetAcceptAction)

    // Xử lý nút "Từ chối" trong lệnh /tweet
    this.bot.action('tweet_reject', tweetRejectAction)

    // Xử lý nút "Tạo mới" trong lệnh /tweet
    this.bot.action(/tweet_retry_(.+)/, tweetRetryAction)

    // Lệnh kiểm tra: /check 123
    this.bot.command('check', checkCommand)

    // Lệnh /start
    this.bot.command('start', (ctx) => ctx.reply('Tôi đã sẵn sàng phục vụ bạn!'))

    // Lệnh /tweet để tạo nội dung bằng Gemini
    this.bot.command('tweet', tweetCommand)

    // Lệnh /checkin để gửi vị trí
    this.bot.command('checkin', locationCommand)

    // Bắt khi user gửi ảnh (Photo)
    this.bot.on(message('photo'), handlePhotoHandler)

    // Bắt khi user gửi file (Document)
    this.bot.on(message('document'), handleDocumentHandler)

    // Chào mừng thành viên mới vào Group
    this.bot.on(message('new_chat_members'), newChatMembersHandler)

    // // Chat trực tiếp với Bot
    this.bot.on(message('text'), async (ctx) => {
      ctx.reply('Bạn đã gửi: ' + ctx.message.text)
    })

    // Bắt bất cứ câu nào có chứa từ "lỗi" hoặc "error" (không phân biệt hoa thường)
    this.bot.hears(/lỗi|error/i, errorHear)
  }
}

export default Telegram.getInstance()
