import { Context, Markup } from 'telegraf'
import geminiHelper from '~/helpers/gemini.helper'

export async function tweetCommand(ctx: Context) {
  const message = ctx.message as any
  if (!message?.text) return

  const text = message.text.split('/tweet ')[1]
  if (!text) return ctx.reply('VD: /tweet Viết về AI')

  const waitingMsg = await ctx.reply('⏳ Đang tạo nội dung...')

  try {
    const aiResponse = await geminiHelper.generateResponse(text)

    // Xóa tin nhắn "Đang tạo..." để tránh rác chat
    await ctx.deleteMessage(waitingMsg.message_id).catch(() => {})

    // Gửi nội dung mới kèm 3 nút bấm
    await ctx.reply(aiResponse, {
      parse_mode: 'Markdown', // Hoặc 'HTML' tùy format Gemini trả về
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Chấp nhận', 'tweet_accept'),
          // Markup.button.callback('🔄 Tạo mới', `tweet_retry_${Buffer.from(text).toString('base64').substring(0, 35)}`),
          Markup.button.callback('❌ Từ chối', 'tweet_reject')
        ]
      ])
    })
  } catch (error) {
    ctx.reply('❌ Có lỗi khi gọi Gemini.')
    await ctx.deleteMessage(waitingMsg.message_id).catch(() => {})
  }
}
