import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import NotificationGateway from '~/socket/gateways/notification.gateway'
import { PUBLISH_NOTIFICATION } from './publisher'

// Sẽ đưa sang rabbitmq sau
export async function initSubscriber() {
  await pubSubServiceInstance.subscribe(PUBLISH_NOTIFICATION, async ({ new_noti, receiver_id }) => {
    NotificationGateway.sendNotification(new_noti, receiver_id)
  })
}
