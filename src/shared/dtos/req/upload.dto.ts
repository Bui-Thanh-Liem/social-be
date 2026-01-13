import { z } from 'zod'

export const presignedUrlDtoSchema = z.object({
  file_name: z.string().trim(),
  file_type: z.string().trim(),
  file_size: z.number().min(1, 'file_size phải lớn hơn 0')
})

export const deleteMediaDtoSchema = z.object({
  s3_keys: z.array(z.string().trim()).min(1, 'Cần ít nhất 1 s3_key để xóa')
})

export const uploadConfirmDtoSchema = deleteMediaDtoSchema

export type PresignedUrlDto = z.infer<typeof presignedUrlDtoSchema>
export type DeleteMediaDto = z.infer<typeof deleteMediaDtoSchema>
export type UploadConfirmDto = z.infer<typeof uploadConfirmDtoSchema>
