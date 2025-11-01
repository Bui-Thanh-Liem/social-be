import { ResNewFeeds } from '../dtos/res/tweet.dto'

export type ResMultiType<T> = {
  total: number
  total_page: number
  items: T[]
  extra?: ResNewFeeds
}
