import { ObjectId } from 'mongodb'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IBase } from '../../shared/interfaces/schemas/base.interface'
import { IMedia } from '../media/media.interface'
import { IUser } from '../users/users.interface'
import { ICommunity } from '../communities/communities.interface'
import { ITweet } from '../tweets/tweets.interface'

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
