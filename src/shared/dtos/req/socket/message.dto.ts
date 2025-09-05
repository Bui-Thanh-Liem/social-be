import { z } from 'zod'

export const messageDtoSchema = z.object({
  roomId: z.string().min(1, 'roomId is required'),
  text: z.string().min(1, 'text cannot be empty')
})
