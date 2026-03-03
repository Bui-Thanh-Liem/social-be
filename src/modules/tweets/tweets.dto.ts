import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { MediaBareDtoSchema } from '../../shared/dtos/common/media-bare.dto'
import { ICommunity } from '../communities/communities.interface'
import { CONSTANT_MAX_LENGTH_CONTENT } from './tweet.constant'
import { EFeedType, EFeedTypeItem, ETweetAudience, ETweetType } from './tweets.enum'
import { ITweet } from './tweets.interface'

// Codes DTO
export const codesDtoSchema = z.object({
  _id: z.string().trim(),
  langKey: z.string().trim(),
  code: z.string().max(500, `Nội dung tối đa 500 kí tự`).trim()
})

export const createTweetDtoSchema = z.object({
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
  medias: z.array(MediaBareDtoSchema).optional(),
  textColor: z.string().trim().optional(),
  bgColor: z.string().trim().optional(),
  codes: z.array(codesDtoSchema).optional()
})

export const getOneTweetByIdDtoSchema = z.object({
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
export type GetOneTweetByIdDto = z.infer<typeof getOneTweetByIdDtoSchema>
export type CreateTweetDto = z.infer<typeof createTweetDtoSchema>
export type GetTweetChildrenDtoParams = z.infer<typeof getTweetChildrenDtoSchemaParams>
export type GetNewFeedTypeDto = z.infer<typeof getNewFeedTypeDtoSchema>
export type GetProfileTweetDto = z.infer<typeof getProfileTweetDtoSchema>

export type ResCreateTweet = ITweet

export type ResNewFeeds = { type: EFeedTypeItem; items: ITweet[] | ICommunity[] }

export interface ResCountViewLinkBookmarkInWeek {
  tweet_views_count: {
    data: {
      name: string // T2, T3, ...
      tt: number // Tuần trước
      tn: number // Tuần này
    }[]
    total_views: number
  }
  tweet_likes_count: {
    data: {
      name: string // T2, T3, ...
      tt: number // Tuần trước
      tn: number // Tuần này
    }[]
    total_views: number
  }
  tweet_bookmarks_count: {
    data: {
      name: string // T2, T3, ...
      tt: number // Tuần trước
      tn: number // Tuần này
    }[]
    total_views: number
  }
}
