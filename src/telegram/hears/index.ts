import { Context } from 'telegraf'

export function errorHear(ctx: Context) {
  ctx.reply('Có vẻ bạn đang gặp sự cố? Hãy gửi ảnh màn hình để Admin hỗ trợ nhé.')
}
