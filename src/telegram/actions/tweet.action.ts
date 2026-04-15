import geminiHelper from '~/helpers/gemini.helper'
import { UpdateAction } from '..'
import { Markup } from 'telegraf'

export async function tweetAcceptAction(ctx: UpdateAction) {
  // 1. Lấy nội dung text từ tin nhắn gốc mà AI đã sinh ra
  // Lưu ý: Đối với Inline Query, message nằm trong callbackQuery
  const message = ctx.callbackQuery.message || {}

  // Trong Telegram, text của tin nhắn thường nằm ở message.text
  // Nếu tin nhắn có format (Bold, Italic...), nó nằm ở message.text
  const aiGeneratedContent = 'text' in message ? message.text : ''
  if (!aiGeneratedContent) {
    return ctx.answerCbQuery('❌ Không tìm thấy nội dung!')
  }

  // 2. Phản hồi cho người dùng (icon đồng hồ cát biến mất)
  await ctx.answerCbQuery('✅ Đã duyệt bài viết!')

  // 3. Thực hiện logic của bạn (Ví dụ: Gọi API đăng bài, lưu DB...)
  console.log('Nội dung cần đăng:', aiGeneratedContent)

  // 4. Cập nhật lại giao diện tin nhắn (Xóa các nút bấm để tránh nhấn lại)
  await ctx.editMessageText(`✅ **ĐÃ DUYỆT BÀI ĐĂNG:**\n\n${aiGeneratedContent}`, {
    parse_mode: 'Markdown'
  })
}

export async function tweetRejectAction(ctx: UpdateAction) {
  // 1. Phản hồi cho người dùng (icon đồng hồ cát biến mất)
  await ctx.answerCbQuery('❌ Đã từ chối bài viết!')

  // 2. Cập nhật lại giao diện tin nhắn (Xóa các nút bấm để tránh nhấn lại)
  await ctx.editMessageText(`❌ **BÀI ĐĂNG ĐÃ BỊ TỪ CHỐI**`, {
    parse_mode: 'Markdown'
  })
}

export async function tweetRetryAction(ctx: UpdateAction) {
  // 1. Lấy nội dung gốc từ callback data (đã được mã hóa base64)
  const callbackQuery = ctx.callbackQuery as any
  const oldAiGeneratedContent = callbackQuery.message?.text || ''
  console.log('tweetRetryAction - oldAiGeneratedContent:', oldAiGeneratedContent)

  if (!callbackQuery || !callbackQuery?.data) {
    return ctx.answerCbQuery('❌ Dữ liệu không hợp lệ!')
  }

  const callbackData = callbackQuery?.data || ''
  const base64Text = callbackData.replace('tweet_retry_', '')
  const originalText = Buffer.from(base64Text, 'base64').toString('utf-8')
  console.log('tweetRetryAction - originalText:', originalText)

  if (!originalText) {
    return ctx.answerCbQuery('❌ Không tìm thấy nội dung gốc!')
  }

  // 2. Phản hồi cho người dùng (icon đồng hồ cát biến mất)
  await ctx.answerCbQuery('🔄 Đang tạo lại nội dung...')

  // 3. Gọi lại Gemini để tạo nội dung mới dựa trên originalText
  try {
    const newContent = await geminiHelper.generateResponse(originalText)

    // 4. Cập nhật lại tin nhắn với nội dung mới
    await ctx.editMessageText(newContent, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Chấp nhận', 'tweet_accept'),
          Markup.button.callback(
            '🔄 Tạo mới',
            `tweet_retry_${Buffer.from(originalText).toString('base64').substring(0, 30)}`
          ),
          Markup.button.callback('❌ Từ chối', 'tweet_reject')
        ]
      ])
    })
  } catch (error) {
    await ctx.answerCbQuery('❌ Có lỗi khi tạo lại nội dung.')
  }
}
