import { ObjectId } from 'mongodb'
import { IBase } from '../../shared/interfaces/base.interface'
import { ICommunity } from '../communities/communities.interface'
import { IMedia } from '../media/media.interface'
import { ITweet } from '../tweets/tweets.interface'
import { IUser } from '../users/users.interface'
import { ENotificationType } from './notifications.enum'

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
