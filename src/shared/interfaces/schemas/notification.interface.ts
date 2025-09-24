import { ObjectId } from 'mongodb'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IBase } from './base.interface'
import { IUser } from './user.interface'

export interface INotification extends IBase {
  content: string
  type: ENotificationType
  sender: IUser | ObjectId
  receiver: IUser | ObjectId
  isRead: boolean
  refId: ObjectId | undefined
}
