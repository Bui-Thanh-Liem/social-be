import { UpdateAction } from '..'

export async function approveAction(ctx: UpdateAction) {
  const id = ctx.match[1]
  await ctx.answerCbQuery('Đang duyệt...')
  await ctx.editMessageText(`✅ Đã duyệt mã: ${id}`)
}
