import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EMediaType, ETweetType } from '~/shared/enums/type.enum'

const MediaSchema = z.object({
  url: z.string().url({ message: 'Invalid media URL' }),
  type: z.nativeEnum(EMediaType)
})

export const CreateTweetDtoSchema = z.object({
  type: z.nativeEnum(ETweetType),
  audience: z.nativeEnum(ETweetAudience),
  parent_id: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'Invalid MongoDB ObjectId'
    })
    .optional(),
  content: z.string().trim(),
  hashtags: z.array(z.string().trim()).optional(), // client gửi lên name
  mentions: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'Invalid MongoDB ObjectId'
      })
    )
    .optional(),
  medias: z.array(MediaSchema).optional()
})

export const GetOneTweetByIdDtoSchema = z.object({
  tweet_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'Invalid MongoDB ObjectId'
  })
})

export type GetOneTweetByIdDto = z.infer<typeof GetOneTweetByIdDtoSchema>
export type CreateTweetDto = z.infer<typeof CreateTweetDtoSchema>
