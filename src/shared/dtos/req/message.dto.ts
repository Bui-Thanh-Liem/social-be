import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'

export const CreateMessageDtoSchema = z.object({
  conversation: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, { message: 'Invalid MongoDB ObjectId' }),
  content: z.string().trim(),
  attachments: z.array(z.string().trim()).optional()
})

export type CreateMessageDto = z.infer<typeof CreateMessageDtoSchema>
