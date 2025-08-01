import { ObjectId } from 'mongodb'
import { ETweetAudience } from '~/shared/enums/common.enum'
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
  mentions: ObjectId[] // nhắc đến
  medias: IMedia[]
  guest_view: number
  user_view: number
}
