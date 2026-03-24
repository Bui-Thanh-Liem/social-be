import { ResNewFeeds } from '~/dtos/tweets.dto'

export type ResMultiType<T> = {
  total: number
  total_page: number
  items: T[]
  extra?: ResNewFeeds
}
