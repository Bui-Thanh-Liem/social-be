import { Context } from 'telegraf'
import { envs } from '~/configs/env.config'
import { Update } from 'telegraf/types'

export const authTelegramMiddleware = async (ctx: Context<Update>, next: () => Promise<void>) => {
  const allowedIds = [Number(envs.TELEGRAM_CHAT_ID)]
  const fromId = ctx.from?.id

  //
  if (!fromId) {
    console.log('Cảnh báo: Update không có thông tin người gửi.')
    return
  }

  //
  if (allowedIds.includes(ctx.from?.id)) return next()
  console.log(`Cảnh báo: User ${ctx.from?.id} cố gắng truy cập.`)
}
