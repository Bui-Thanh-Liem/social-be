import { z } from 'zod'

export const sendMessageDtoSchema = z
  .object({
    conversation: z.string().min(1, 'bắt buộc phải có id cuộc trò chuyện.'),
    sender: z.string().min(1, 'Người gửi là bắt buộc'),
    content: z.string().optional(),
    attachments: z.array(z.string()).optional()
  })
  .refine(
    (data) => {
      return (data.content && data.content.trim().length > 0) || (data.attachments && data.attachments.length > 0)
    },
    {
      message: 'Cần có nội dung hoặc tệp đính kèm.',
      path: ['content']
    }
  )
