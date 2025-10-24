import { Collection, Db, ObjectId } from 'mongodb'
import { ENotificationType } from '~/shared/enums/type.enum'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { BaseSchema } from './Base.schema'

export class NotificationSchema extends BaseSchema implements INotification {
  content: string
  type: ENotificationType
  refId: ObjectId | undefined
  sender: ObjectId | IUser
  receiver: ObjectId | IUser
  isRead: boolean

  constructor(noti: Partial<INotification>) {
    super()
    this.isRead = false
    this.content = noti.content || ''
    this.refId = noti.refId || new ObjectId()
    this.sender = noti.sender || new ObjectId()
    this.receiver = noti.receiver || new ObjectId()
    this.type = noti.type || ENotificationType.Other
  }
}

export let NotificationCollection: Collection<NotificationSchema>

export function initNotificationCollection(db: Db) {
  NotificationCollection = db.collection<NotificationSchema>('notifications')
}
