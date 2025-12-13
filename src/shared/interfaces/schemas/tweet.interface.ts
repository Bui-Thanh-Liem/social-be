import { ObjectId } from 'mongodb'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { ETweetStatus } from '~/shared/enums/status.enum'
import { ETweetType } from '~/shared/enums/type.enum'
import { IMedia } from '../common/media.interface'
import { IBase } from './base.interface'

export interface ITweet extends IBase {
  user_id: ObjectId
  type: ETweetType
  audience: ETweetAudience
  content: string
  parent_id: null | ObjectId // null khi là tweet gốc
  hashtags: ObjectId[]
  status: ETweetStatus
  mentions: ObjectId[] // nhắc đến
  media: IMedia[] | null
  guest_view: number
  user_view: number
  likes_count: number
  comments_count: number

  //
  community_id: null | ObjectId

  //
  shares_count?: number
  retweets_count?: number
  quotes_count?: number
  is_like?: boolean
  is_bookmark?: boolean
  retweet?: string // id retWeet của tôi
  quote?: string // // id quoteTweet của tôi
  total_views?: number
}
