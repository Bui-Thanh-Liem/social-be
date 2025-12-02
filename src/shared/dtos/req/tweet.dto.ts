import { z } from 'zod'
import { CONSTANT_MAX_LENGTH_CONTENT, CONSTANT_REGEX } from '~/shared/constants'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EFeedType, EMediaType, ETweetType } from '~/shared/enums/type.enum'

export const MediaSchema = z.object({
  url: z.string().url({ message: 'Url không hợp lệ' }),
  resource_type: z.nativeEnum(EMediaType),
  public_id: z.string().trim()
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
  content: z.string().max(CONSTANT_MAX_LENGTH_CONTENT, `Nội dung tối đa ${CONSTANT_MAX_LENGTH_CONTENT} kí tự`).trim(),
  hashtags: z.array(z.string().trim()).optional(), // client gửi lên name
  mentions: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'ObjectId không hợp lệ'
      })
    )
    .optional(),
  media: z.array(MediaSchema).optional().nullable()
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
      errorMap: () => ({ message: 'Type không hợp lệ' })
    })
  )
})

export const getNewFeedTypeDtoSchema = z.object({
  feed_type: z.nativeEnum(EFeedType, {
    errorMap: () => ({ message: 'Type không hợp lệ' })
  })
})

export const getProfileTweetDtoSchema = z.object({
  tweet_type: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.nativeEnum(ETweetType, {
      errorMap: () => ({ message: 'Type không hợp lệ' })
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
