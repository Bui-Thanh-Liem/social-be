import { ICommunity } from '~/modules/communities/communities.interface'
import { ITweet } from '~/modules/tweets/tweets.interface'
import { EFeedTypeItem } from '~/shared/enums/type.enum'

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
