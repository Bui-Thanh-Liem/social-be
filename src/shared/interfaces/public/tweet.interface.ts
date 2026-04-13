import { ObjectId } from 'mongodb'
import { IMediaBare } from '~/shared/interfaces/common/media-bare.interface'
import { IBase } from '~/shared/interfaces/common/base.interface'
import { ETweetAudience, ETweetStatus, ETweetType } from '~/shared/enums/public/tweets.enum'

export interface ICodesTweet {
  _id: string
  code: string
}

export interface ITweet extends IBase {
  user_id: ObjectId
  type: ETweetType
  audience: ETweetAudience
  content: string
  parent_id: null | ObjectId // null khi là tweet gốc
  hashtags: ObjectId[]
  status: ETweetStatus
  mentions: ObjectId[] // nhắc đến
  medias: IMediaBare[] | null
  guest_view: number
  user_view: number
  likes_count: number
  comments_count: number
  textColor: string // màu chữ
  bgColor: string // màu nền
  codes: ICodesTweet[] | null // mã code nếu có
  embed_code: string // mã nhúng nếu có

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
