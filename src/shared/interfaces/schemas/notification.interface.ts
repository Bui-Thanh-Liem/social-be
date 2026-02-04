import { ObjectId } from 'mongodb'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IBase } from './base.interface'
import { ICommunity } from './community.interface'
import { ITweet } from './tweet.interface'
import { IUser } from './user.interface'
import { IMedia } from './media.interface'

export interface INotification extends IBase {
  content: string
  type: ENotificationType
  sender: IUser | ObjectId
  receiver: IUser | ObjectId
  isRead: boolean
  ref_id: ObjectId | undefined

  tweet_ref?: ITweet
  user_ref?: IUser
  community_ref?: ICommunity
  media_ref?: IMedia
}
