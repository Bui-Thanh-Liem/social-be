import { z } from 'zod'

export const sendMessageDtoSchema = z.object({
  conversation: z.string().min(1, 'roomId is required'),
  sender: z.string().min(1, 'roomId is required'),
  content: z.string().min(1, 'text cannot be empty')
})
