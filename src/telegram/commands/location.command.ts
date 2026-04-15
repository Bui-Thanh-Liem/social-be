import { Context, Markup } from 'telegraf'

export const locationCommand = (ctx: Context) => {
  return ctx.reply(
    'Để bắt đầu, hãy nhấn nút bên dưới để chia sẻ vị trí:',
    Markup.keyboard([[Markup.button.locationRequest('📍 Gửi vị trí của tôi')]])
      .resize() // Quan trọng: Giúp nút không chiếm nửa màn hình
      .oneTime() // Gửi xong nút sẽ tự ẩn vào menu
  )
}
