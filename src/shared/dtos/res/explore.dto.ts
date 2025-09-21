import { IMedia } from '~/shared/interfaces/common/media.interface'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'

export interface IResTodayNews {
  id: number
  time: Date
  title: string
  media: IMedia
  category: string
  posts: number // Số lượng bài đã đăng với keyword/hashtag nổi bật hôm nay
  trending: ITrending
  avatars: string[]
}
