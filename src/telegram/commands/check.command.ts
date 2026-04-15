import { Context } from 'telegraf'

export async function checkCommand(ctx: Context) {
  const message = ctx.message as any
  if (!message?.text) return

  const args = message.text.split(' ').slice(1)
  if (args.length === 0) return ctx.reply('Vui lòng nhập ID. VD: /check 123')

  const id = args[0]
  await ctx.reply(`🔍 Đang kiểm tra dữ liệu cho ID: ${id}...`)
  // Gọi Service của bạn để lấy data từ DB ở đây
}
