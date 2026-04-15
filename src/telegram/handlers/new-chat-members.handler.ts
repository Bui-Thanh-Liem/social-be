import { Context } from 'telegraf'
import { User } from 'telegraf/types'

export function newChatMembersHandler(ctx: Context) {
  const message = ctx.message as any
  if (!message?.new_chat_members) return

  const newMembers = (message.new_chat_members || []) as User[]
  newMembers.forEach((member) => {
    if (member.id === ctx.botInfo.id) {
      return ctx.reply('Cảm ơn đã thêm tôi vào nhóm! Tôi là AI Assistant.')
    }
    ctx.reply(`Chào mừng ${member.first_name}!`)
  })
}
