import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import VideosService from '~/services/Videos.service'
import { EVideoStatus } from '~/shared/enums/status.enum'
import { PUBLISH_CONVERT_VIDEO, PUBLISH_NOTIFICATION } from './publisher'
import NotificationGateway from '~/socket/gateways/Notification.gateway'

export async function initSubscriber() {
  await pubSubServiceInstance.subscribe(PUBLISH_CONVERT_VIDEO, async (payload) => {
    await VideosService.changeStatus(payload.video_id, EVideoStatus.Success)
  })

  await pubSubServiceInstance.subscribe(PUBLISH_NOTIFICATION, async ({ newNoti, receiverId }) => {
    NotificationGateway.sendNotification(newNoti, receiverId)
  })
}
