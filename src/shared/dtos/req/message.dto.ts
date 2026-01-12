import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const CreateMessageDtoSchema = z.object({
  content: z.string().trim().optional(),
  attachments: z.array(z.string().trim()).optional(),
  conversation: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, { message: 'ObjectId không hợp lệ' })
})

export const GetMultiMessageByConversationDtoSchema = z.object({
  conversation_id: z.string().trim()
})

export type CreateMessageDto = z.infer<typeof CreateMessageDtoSchema>
export type GetMultiMessageByConversationDto = z.infer<typeof GetMultiMessageByConversationDtoSchema>
