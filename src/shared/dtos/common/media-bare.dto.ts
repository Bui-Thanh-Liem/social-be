import z from 'zod'

export const MediaBareDtoSchema = z.object({
  s3_key: z.string().trim(),
  url: z.string().url('URL không hợp lệ').trim()
})
