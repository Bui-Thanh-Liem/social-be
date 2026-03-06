import { Collection, Db, ObjectId } from 'mongodb'
import { INotification } from '~/modules/notifications/notifications.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IUser } from '../users/users.interface'
import { ENotificationType } from './notifications.enum'

export const COLLECTION_NOTIFICATIONS_NAME = 'notifications'
export class NotificationsSchema extends BaseSchema implements INotification {
  content: string
  type: ENotificationType
  ref_id: ObjectId | undefined
  sender: ObjectId | IUser
  receiver: ObjectId | IUser
  isRead: boolean

  constructor(noti: Partial<INotification>) {
    super()
    this.isRead = false
    this.content = noti.content || ''
    this.ref_id = noti.ref_id || new ObjectId()
    this.sender = noti.sender || new ObjectId()
    this.receiver = noti.receiver || new ObjectId()
    this.type = noti.type || ENotificationType.Other
  }
}

export let NotificationsCollection: Collection<NotificationsSchema>

export function initNotificationsCollection(db: Db) {
  NotificationsCollection = db.collection<NotificationsSchema>(COLLECTION_NOTIFICATIONS_NAME)
}
