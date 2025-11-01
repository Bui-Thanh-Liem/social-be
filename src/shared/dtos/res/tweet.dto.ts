import { EFeedTypeItem } from '~/shared/enums/type.enum'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'

export type ResCreateTweet = ITweet

export type ResNewFeeds = { type: EFeedTypeItem; items: ITweet[] | ICommunity[] }
