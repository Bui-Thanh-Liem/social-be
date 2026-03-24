import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { IMedia } from '~/interfaces/media.interface'
import { ITrending } from '~/interfaces/trending.interface'
import { ITweet } from '~/interfaces/tweets.interface'
import { IUser } from '~/interfaces/users.interface'
import { CONSTANT_REGEX } from '~/shared/constants'

export const ParamIdTrendingDtoSchema = z.object({
  trending_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export type ReportTrendingDto = z.infer<typeof ParamIdTrendingDtoSchema>

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
