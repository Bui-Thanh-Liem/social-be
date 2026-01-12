import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import NotificationGateway from '~/socket/gateways/Notification.gateway'
import { PUBLISH_CONVERT_VIDEO, PUBLISH_NOTIFICATION } from './publisher'

export async function initSubscriber() {
  await pubSubServiceInstance.subscribe(PUBLISH_CONVERT_VIDEO, async (payload) => {
    // await VideosService.changeStatus(payload.video_id, EVideoStatus.Success)
  })

  await pubSubServiceInstance.subscribe(PUBLISH_NOTIFICATION, async ({ new_noti, receiver_id }) => {
    NotificationGateway.sendNotification(new_noti, receiver_id)
  })
}
