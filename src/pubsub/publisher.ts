import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import { INotification } from '~/shared/interfaces/schemas/notification.interface'

export const PUBLISH_CONVERT_VIDEO = 'publish-convert-video'
export async function publishCompression(video_id: string) {
  await pubSubServiceInstance.publish(PUBLISH_CONVERT_VIDEO, { video_id })
}

export const PUBLISH_NOTIFICATION = 'publish-notification'
export async function publishNotification(payload: { receiverId: string; newNoti: INotification }) {
  await pubSubServiceInstance.publish(PUBLISH_NOTIFICATION, payload)
}
