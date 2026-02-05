import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { ENotificationType } from '~/shared/enums/type.enum'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'

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
  NotificationsCollection = db.collection<NotificationsSchema>('notifications')
}
