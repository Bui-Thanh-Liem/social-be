import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EFeedType, EMediaType, ETweetType } from '~/shared/enums/type.enum'

export const MediaSchema = z.object({
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
      message: 'ObjectId không hợp lệ'
    })
    .optional(),
  community_id: z
    .string()
    .trim()
    .regex(CONSTANT_REGEX.ID_MONGO, {
      message: 'ObjectId không hợp lệ (community_id)'
    })
    .optional(),
  content: z.string().max(280, 'Nội dung tối đa 280 kí tự').trim(),
  hashtags: z.array(z.string().trim()).optional(), // client gửi lên name
  mentions: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'ObjectId không hợp lệ'
      })
    )
    .optional(),
  media: MediaSchema.optional()
})

export const GetOneTweetByIdDtoSchema = z.object({
  tweet_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const getTweetChildrenDtoSchemaParams = z.object({
  tweet_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  }),
  tweet_type: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val), // Chuyển chuỗi thành số
    z.nativeEnum(ETweetType, {
      errorMap: () => ({ message: 'Invalid Tweet Type' })
    })
  )
})

export const getNewFeedTypeDtoSchema = z.object({
  feed_type: z.nativeEnum(EFeedType, {
    errorMap: () => ({ message: 'Invalid Feed Type' })
  })
})

export const getProfileTweetDtoSchema = z.object({
  tweet_type: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.nativeEnum(ETweetType, {
      errorMap: () => ({ message: 'Invalid Tweet Type' })
    })
  )
})

export const paramIdTweetDtoSchema = z.object({
  tweet_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export type ParamIdTweetDto = z.infer<typeof paramIdTweetDtoSchema>
export type GetOneTweetByIdDto = z.infer<typeof GetOneTweetByIdDtoSchema>
export type CreateTweetDto = z.infer<typeof CreateTweetDtoSchema>
export type getTweetChildrenDtoParams = z.infer<typeof getTweetChildrenDtoSchemaParams>
export type getNewFeedTypeDto = z.infer<typeof getNewFeedTypeDtoSchema>
export type getProfileTweetDto = z.infer<typeof getProfileTweetDtoSchema>
