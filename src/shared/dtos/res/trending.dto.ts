import { ObjectId } from 'mongodb'
import { IMedia } from '~/modules/media/media.interface'
import { ITrending } from '~/modules/trending/trending.interface'
import { ITweet } from '~/modules/tweets/tweets.interface'
import { IUser } from '~/modules/users/users.interface'

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
