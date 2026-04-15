import { Context } from 'telegraf'

export async function handlePhotoHandler(ctx: Context) {
  const message = ctx.message as any
  if (!message?.photo) return

  const fileId = message?.photo[message?.photo.length - 1].file_id
  const link = await ctx.telegram.getFileLink(fileId)
  await ctx.reply(`Đã nhận ảnh của bạn. Link tải: ${link.href}`)
}

export async function handleDocumentHandler(ctx: Context) {
  const message = ctx.message as any
  if (!message?.document) return

  const fileName = message?.document.file_name
  await ctx.reply(`Đã nhận file: ${fileName}`)
}
