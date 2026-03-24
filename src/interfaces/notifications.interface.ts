import { ObjectId } from 'mongodb'
import { ENotificationType } from '../enums/notifications.enum'
import { IBase } from '../shared/interfaces/base.interface'
import { ICommunity } from './communities.interface'
import { IMedia } from './media.interface'
import { ITweet } from './tweets.interface'
import { IUser } from './users.interface'

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
