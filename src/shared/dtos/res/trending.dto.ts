import { ObjectId } from 'mongodb'
import { IMedia } from '~/shared/interfaces/common/media.interface'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'

export interface IResTodayNewsOrOutstanding {
  id: number
  time: Date
  media: IMedia
  category: string
  posts: number // Số lượng bài đã đăng với keyword/hashtag nổi bật hôm nay
  trending: ITrending
  relevant_ids: ObjectId[]

  highlight: (Pick<ITweet, '_id' | 'content' | 'created_at'> &
    Pick<IUser, 'avatar' | 'name' | 'username' | 'verify' | 'isFollow'>)[]
}
