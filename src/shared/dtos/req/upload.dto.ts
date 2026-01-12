import { z } from 'zod'

export const presignedURLDtoSchema = z.object({
  fileName: z.string().trim(),
  fileType: z.string().trim()
})

export const deleteDtoSchema = z.object({
  s3_keys: z.array(z.string().trim()).min(1, 'Cần ít nhất 1 s3_key để xóa')
})

export const uploadConfirmDtoSchema = deleteDtoSchema

export type PresignedURLDto = z.infer<typeof presignedURLDtoSchema>
export type DeleteDto = z.infer<typeof deleteDtoSchema>
export type UploadConfirmDto = z.infer<typeof uploadConfirmDtoSchema>
