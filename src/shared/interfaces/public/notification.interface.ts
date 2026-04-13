import { ObjectId } from 'mongodb'
import { ENotificationType } from '../../enums/public/notifications.enum'
import { IBase } from '../common/base.interface'
import { ICommunity } from './community.interface'
import { IMedia } from '../common/media.interface'
import { ITweet } from './tweet.interface'
import { IUser } from './user.interface'

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
