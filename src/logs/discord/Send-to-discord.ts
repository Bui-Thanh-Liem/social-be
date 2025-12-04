import axios from 'axios'
import PQueue from 'p-queue'
import { envs } from '~/configs/env.config'

interface IResErrorForDiscord {
  statusCode: number
  message: string
  stack?: any
  clientIp?: string
  clientId?: string
  request?: any
}

const queue = new PQueue({
  interval: 1000, // 1 giây chia đều
  intervalCap: 2, // tối đa 2 tin nhắn mỗi giây → cực kỳ an toàn với Discord
  carryoverConcurrencyCount: true
})

const WEBHOOK_URL = envs.DISCORD_URL_WEBHOOK

// Thông tin chung cho webhook (có thể tùy chỉnh)
const BOT_NAME = envs.DISCORD_BOT_NAME
const BOT_AVATAR = envs.DISCORD_BOT_AVATAR
export class DiscordLog {
  static async #sendRaw(payload: any) {
    return queue.add(async () => {
      let retryAfter = 1000
      for (let i = 0; i < 5; i++) {
        // retry tối đa 5 lần
        try {
          const response = await axios.post(WEBHOOK_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          })

          // Kiểm tra header rate limit (nếu còn ít thì giảm tốc độ tự động)
          const remaining = response.headers['x-ratelimit-remaining']
          if (remaining && parseInt(remaining) === 0) {
            const resetAfter = parseFloat(response.headers['x-ratelimit-reset-after'] || 1)
            await new Promise((r) => setTimeout(r, resetAfter * 1000 + 200))
          }

          return response.data
        } catch (error: any) {
          if (error.response?.status === 429) {
            retryAfter = (error.response.headers['retry-after'] || retryAfter / 1000) * 1000 + 200
            console.warn(`[Discord Webhook] 429 - Chờ ${retryAfter / 1000}s rồi thử lại... (${i + 1}/5)`)
            await new Promise((r) => setTimeout(r, retryAfter))
            continue
          }

          // Các lỗi khác (mạng, webhook sai, v.v.) chỉ log warning, không retry mãi
          if (i === 4) {
            console.error('[Discord Webhook] Gửi thất bại sau 5 lần retry:', error.message)
            return null // không throw để không làm crash app
          }
        }
      }
    })
  }

  static async #send(embed: any) {
    await this.#sendRaw({
      username: BOT_NAME,
      avatar_url: BOT_AVATAR,
      embeds: [embed]
    })
  }

  static async sendLogError(message: string, info: IResErrorForDiscord) {
    const errorStack = info.stack || 'No stack trace'
    const errorMsg = info.message || 'No additional message'

    const errorCode = info.statusCode || 'N/A'

    const clientIp = info.clientIp || 'N/A'
    const clientId = info.clientId || 'N/A'

    await this.#send({
      title: '🔥 Lỗi Hệ Thống',
      description: '```js\n' + (typeof message === 'string' ? message : String(message)) + '\n```',
      color: 0xe74c3c, // Đỏ đậm
      fields: [
        {
          name: '❗ Mã Lỗi',
          value: '```fix\n' + errorCode + '\n```',
          inline: false
        },
        {
          name: '📛 Thông báo lỗi',
          value: '```diff\n- ' + errorMsg.replace(/\n/g, '\n- ') + '\n```',
          inline: false
        },
        {
          name: '📍 Stack Trace',
          value:
            errorStack.length > 1000
              ? '```js\n' + errorStack.substring(0, 1000) + '...\n```'
              : '```js\n' + errorStack + '\n```',
          inline: false
        },
        {
          name: '🌐 Client IP',
          value: '```fix\n' + clientIp + '\n```',
          inline: false
        },
        {
          name: '🆔 Client ID',
          value: '```fix\n' + clientId + '\n```',
          inline: false
        },
        info.request && {
          name: '🔗 Request Info',
          value: '```json\n' + JSON.stringify(info.request, null, 2).slice(0, 1000) + '\n```',
          inline: false
        }
      ].filter(Boolean),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Error Logger • ' + new Date().toLocaleString('vi-VN'),
        icon_url: BOT_AVATAR
      },
      author: {
        name: BOT_NAME,
        icon_url: BOT_AVATAR
      }
    })
  }

  static async sendLogWarning(message: string, info: IResErrorForDiscord) {
    await this.#send({
      title: '⚠️ Cảnh Báo',
      description: '```fix\n' + message + '\n```',
      color: 0xf39c12, // Cam
      fields:
        Object.keys(info).length > 0
          ? [
              {
                name: 'ℹ️ Chi tiết',
                value: '```json\n' + JSON.stringify(info, null, 2).slice(0, 1014) + '\n```'
              }
            ]
          : [],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Warning • ${new Date().toLocaleString('vi-VN')}`,
        icon_url: BOT_AVATAR
      }
    })
  }

  static async sendLogInfo(message: string, info: IResErrorForDiscord) {
    await this.#send({
      title: 'ℹ️ Thông Báo',
      description: '```yaml\n' + message + '\n```',
      color: 0x3498db, // Xanh dương
      fields:
        Object.keys(info).length > 0
          ? [
              {
                name: 'Chi tiết',
                value: '```json\n' + JSON.stringify(info, null, 2).slice(0, 1014) + '\n```'
              }
            ]
          : [],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Info • ${new Date().toLocaleString('vi-VN')}`
      }
    })
  }

  static async sendLogSuccess(message: string, info: IResErrorForDiscord) {
    await this.#send({
      title: '✅ Thành Công',
      description: '```diff\n+ ' + message.replace(/\n/g, '\n+ ') + '\n```',
      color: 0x2ecc71, // Xanh lá
      fields:
        Object.keys(info).length > 0
          ? [
              {
                name: 'Chi tiết',
                value: '```json\n' + JSON.stringify(info, null, 2).slice(0, 1014) + '\n```'
              }
            ]
          : [],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Success • ${new Date().toLocaleString('vi-VN')}`,
        icon_url: BOT_AVATAR
      }
    })
  }
}
