import z from 'zod'
import { CONSTANT_MAX_LENGTH_CONTENT_REEL } from '~/constants/reel.constant'
import { EReelStatus, EReelType } from '~/enums/public/reel.enum'
import { CONSTANT_REGEX } from '~/shared/constants'
import { MediaBareDtoSchema } from '~/shared/dtos/common/media-bare.dto'

// Create Reel DTO
export const CreateReelDtoSchema = z.object({
  type: z.nativeEnum(EReelType),
  content: z
    .string()
    .max(CONSTANT_MAX_LENGTH_CONTENT_REEL, `Nội dung tối đa ${CONSTANT_MAX_LENGTH_CONTENT_REEL} kí tự`)
    .trim(),

  hashtags: z.array(z.string().trim()).optional(), // client gửi lên name
  mentions: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'ObjectId không hợp lệ'
      })
    )
    .optional(),
  video: MediaBareDtoSchema.optional(),
  status: z.nativeEnum(EReelStatus),
  isPinAvatar: z.boolean().default(false).optional()
})

// Change status reel DTO
export const ChangeStatusReelDtoSchema = z.object({
  status: z.nativeEnum(EReelStatus)
})

export type CreateReelDto = z.infer<typeof CreateReelDtoSchema>
export type ChangeStatusReelDto = z.infer<typeof ChangeStatusReelDtoSchema>
