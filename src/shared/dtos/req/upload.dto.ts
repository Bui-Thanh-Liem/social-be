import { z } from 'zod'

export const presignedUrlDtoSchema = z.object({
  file_name: z.string().trim(),
  file_type: z.string().trim(),
  file_size: z.number().min(1, 'file_size phải lớn hơn 0')
})

export const deleteDtoSchema = z.object({
  s3_keys: z.array(z.string().trim()).min(1, 'Cần ít nhất 1 s3_key để xóa')
})

export const uploadConfirmDtoSchema = deleteDtoSchema

export type PresignedUrlDto = z.infer<typeof presignedUrlDtoSchema>
export type DeleteDto = z.infer<typeof deleteDtoSchema>
export type UploadConfirmDto = z.infer<typeof uploadConfirmDtoSchema>
