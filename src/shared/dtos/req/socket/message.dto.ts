import { z } from 'zod'
import { MediaSchema } from '../tweet.dto'

export const sendMessageDtoSchema = z.object({
  conversation: z.string().min(1, 'conversationId is required'),
  sender: z.string().min(1, 'sender is required'),
  content: z.string().min(1, 'content cannot be empty'),
  attachments: z.array(MediaSchema).optional()
})
