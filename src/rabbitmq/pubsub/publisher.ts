import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import { INotification } from '~/interfaces/notifications.interface'

// Sẽ đưa sang rabbitmq sau
export const PUBLISH_NOTIFICATION = 'publish-notification'
export async function publishNotification(payload: { receiver_id: string; new_noti: INotification }) {
  await pubSubServiceInstance.publish(PUBLISH_NOTIFICATION, payload)
}
