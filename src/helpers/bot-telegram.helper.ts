import { Markup, Telegraf } from 'telegraf'
import axios from 'axios'
import { envs } from '~/configs/env.config'
import FormData from 'form-data'
import fs from 'fs'
import { message } from 'telegraf/filters'

class BotTelegramService {
  // Token của bot Telegram, lấy từ BotFather
  private botToken: string

  // Chat ID của người nhận (có thể là cá nhân hoặc nhóm)
  private chatId: string
  private chatGroupId: string

  // Instance của bot
  private bot: Telegraf

  constructor() {
    this.botToken = envs.TELEGRAM_BOT_TOKEN
    this.chatId = envs.TELEGRAM_CHAT_ID
    this.chatGroupId = envs.TELEGRAM_CHAT_GROUP_ID
    this.bot = new Telegraf(this.botToken)

    // 1. Đăng ký các action (Duyệt/Từ chối)
    this.registerActions()

    // 2. PHẢI CHẠY BOT THÌ NÓ MỚI NGHE ĐƯỢC LỆNH
    this.startBot()

    // 3. Đăng ký các hàm dừng an toàn
    this.stopBot()
  }

  // Hàm này có thể dùng để truy cập trực tiếp instance bot nếu cần
  getBot() {
    return this.bot
  }

  // Hàm khởi động bot
  private startBot() {
    this.bot.launch().then(() => {
      console.log('✅ Telegram bot started!')
    })
  }

  // Đăng ký các sự kiện dừng để tắt bot an toàn
  private stopBot() {
    process.once('SIGINT', () => this.bot.stop('SIGINT'))
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
  }

  // Hàm lấy thông tin bot (chủ yếu để test kết nối)
  async getBotInfo() {
    try {
      this.bot.on('message', (ctx) => {
        console.log(ctx.chat)
      })
    } catch (error) {
      console.log(':::', error)
    }
  }

  /**
   *
   * @param message
   * @param chatId
   *
   * <b>Bold text</b> (In đậm)
   * <i>Italic text</i> (In nghiêng)
   * <code>Inline code</code> (Dạng code - rất hay dùng cho ID hoặc mã lỗi)
   * <pre>Preformatted text</pre> (Dạng code block, giữ nguyên format, thường dùng cho log hoặc stack trace)<pre>Fixed-width code block</pre> (Khối code)
   * <a>URL</a> (Link)
   */
  async sendTelegramAlert({ message, chatId }: { message: string; chatId?: string }) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`
    console.log('url :::', url)

    try {
      const response = await axios.get(url, {
        params: {
          text: message,
          parse_mode: 'HTML', // Cho phép dùng các thẻ <b>, <i>, <a>...
          chat_id: chatId || this.chatId
        }
      })

      if (response.data.ok) {
        console.log('Đã gửi thông báo tới Telegram thành công!')
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn tới Telegram:', error)
    }
  }

  /**
   * Gửi tài liệu (Excel, PDF, Log,...) tới Telegram
   * @param filePath Đường dẫn vật lý của file trên server
   * @param caption Tin nhắn đi kèm file
   * @param chatId ID người nhận (mặc định lấy từ env)
   */
  async sendTelegramDocument({ filePath, caption, chatId }: { filePath: string; caption?: string; chatId?: string }) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendDocument`

    try {
      // 1. Kiểm tra file có tồn tại không
      if (!fs.existsSync(filePath)) {
        throw new Error(`File không tồn tại tại đường dẫn: ${filePath}`)
      }

      // 2. Tạo Form Data
      const form = new FormData()
      form.append('chat_id', chatId || this.chatId)
      form.append('document', fs.createReadStream(filePath)) // Stream file để tiết kiệm RAM
      if (caption) {
        form.append('caption', caption)
        form.append('parse_mode', 'HTML')
      }

      // 3. Gửi POST request với Header của Form Data
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders()
        }
      })

      if (response.data.ok) {
        console.log('✅ Gửi tài liệu tới Telegram thành công!')
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi gửi tài liệu tới Telegram:', error?.response?.data || error.message)
    }
  }

  /**
   * Gửi hình ảnh (đồ thị, QR Code, Screenshot lỗi) tới Telegram
   * @param photoPath Đường dẫn file ảnh hoặc URL ảnh
   * @param caption Tin nhắn đi kèm bên dưới ảnh
   */
  async sendTelegramPhoto({ photoPath, caption, chatId }: { photoPath: string; caption?: string; chatId?: string }) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`

    try {
      const form = new FormData()
      form.append('chat_id', chatId || this.chatId)

      // Kiểm tra nếu là URL ảnh thì gửi trực tiếp, nếu là path thì dùng Stream
      if (photoPath.startsWith('http')) {
        form.append('photo', photoPath)
      } else {
        if (!fs.existsSync(photoPath)) throw new Error('File ảnh không tồn tại!')
        form.append('photo', fs.createReadStream(photoPath))
      }

      if (caption) {
        form.append('caption', caption)
        form.append('parse_mode', 'HTML')
      }

      const response = await axios.post(url, form, {
        headers: { ...form.getHeaders() }
      })

      if (response.data.ok) {
        console.log('✅ Gửi ảnh tới Telegram thành công!')
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi gửi ảnh:', error?.response?.data || error.message)
    }
  }

  /**
   *
   * @param param
   */
  async sendDailyReport({ data, labels }: { data: number[]; labels: string[] }) {
    const chartConfig = {
      type: 'line',
      data: {
        labels: labels, // Ví dụ: ['Thứ 2', 'Thứ 3', 'Thứ 4']
        datasets: [
          {
            label: 'Người dùng mới',
            data: data, // Ví dụ: [50, 150, 100]
            borderColor: 'rgb(75, 192, 192)',
            fill: false
          }
        ]
      }
    }

    // Tạo URL biểu đồ
    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`

    // Gửi thẳng qua Telegram
    await this.sendTelegramPhoto({
      photoPath: chartUrl,
      caption: `📈 <b>BÁO CÁO TĂNG TRƯỞNG</b>\n<i>Dữ liệu cập nhật realtime từ hệ thống.</i>`
    })
  }

  /**
   * Hàm gửi thông báo kèm nút bấm Duyệt/Từ chối
   */
  async sendPendingRequest({ requestId, amount, user }: { requestId: string; amount: number; user: string }) {
    const message = `
        🚀 <b>YÊU CẦU DUYỆT RÚT TIỀN</b>
        ━━━━━━━━━━━━━━━━━━
        👤 <b>Người dùng:</b> <code>${user}</code>
        💰 <b>Số tiền:</b> <code>${amount.toLocaleString()} VNĐ</code>
        🆔 <b>Mã yêu cầu:</b> <code>${requestId}</code>
        ━━━━━━━━━━━━━━━━━━
        <i>Vui lòng nhấn nút bên dưới để xử lý:</i>
    `

    try {
      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Duyệt ngay', `approve_${requestId}`),
            Markup.button.callback('❌ Từ chối', `reject_${requestId}`)
          ],
          [Markup.button.url('🔍 Xem chi tiết trên Web', 'https://your-admin.com/request/' + requestId)]
        ])
      })
    } catch (error) {
      console.error('Lỗi gửi thông báo:', error)
    }
  }

  /**
   * Đăng ký các action callback cho nút bấm
   */
  private registerActions() {
    this.bot.action(/approve_(.+)/, async (ctx) => {
      try {
        const requestId = ctx.match[1]

        // 1. Phải gọi answerCbQuery ngay lập tức
        await ctx.answerCbQuery('Đang xử lý duyệt...').catch(() => {})

        // 2. Logic cập nhật DB của bạn ở đây...
        console.log(`Duyệt yêu cầu: ${requestId}`)

        // 3. Cập nhật giao diện tin nhắn
        await ctx
          .editMessageText(`✅ <b>ĐÃ DUYỆT:</b> Yêu cầu <code>${requestId}</code>`, { parse_mode: 'HTML' })
          .catch(() => {})
      } catch (error) {
        console.error('Lỗi xử lý action Approve:', error)
      }
    })

    this.bot.action(/reject_(.+)/, async (ctx) => {
      try {
        const requestId = ctx.match[1]
        console.log(`Từ chối yêu cầu: ${requestId}`)
        await ctx.answerCbQuery('Đã từ chối.').catch(() => {})
        await ctx.editMessageText(`❌ <b>ĐÃ TỪ CHỐI</b>`, { parse_mode: 'HTML' }).catch(() => {})
      } catch (error) {
        console.error('Lỗi xử lý action Reject:', error)
      }
    })

    // Khi người dùng gõ /baocao
    this.bot.command('baocao', async (ctx) => {
      await ctx.reply('Đang tổng hợp báo cáo doanh thu...')
      // Gọi hàm gửi report của bạn ở đây
    })

    // Bắt bất cứ tin nhắn nào bắt đầu bằng từ "Tìm"
    this.bot.hears(/^Tìm (.+)$/i, async (ctx) => {
      const email = ctx.match[1] // Lấy ra phần email sau chữ "Tìm "
      await ctx.reply(`🔍 Đang truy vấn Database cho email: ${email}`)
      // Logic tìm trong MongoDB...
    })

    // Bắt các tin nhắn chào hỏi
    this.bot.hears(['hello', 'hi', 'chào'], (ctx) => {
      ctx.reply('Chào Admin! Chúc bạn một ngày làm việc hiệu quả.')
    })

    this.bot.on(message('text'), (ctx) => ctx.reply('Bot không hiểu lệnh này, vui lòng gõ /help hoặc sử dụng nút bấm.'))
  }
}

const botTelegramService = new BotTelegramService()
export default botTelegramService
