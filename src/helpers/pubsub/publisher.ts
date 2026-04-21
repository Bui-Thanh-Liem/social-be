import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import { INotification } from '~/shared/interfaces/public/notification.interface'
import { IHandleNewsFeedType } from '~/shared/interfaces/common/handle-news-feed.interface'

// Hàm này sử dụng trong woker
export interface PublishNotificationPayload {
  receiver_id: string
  new_noti: INotification
}
export const PUBLISH_NOTIFICATION = 'publish-notification'
export async function publishNotification(payload: PublishNotificationPayload) {
  await pubSubServiceInstance.publish(PUBLISH_NOTIFICATION, payload)
}

//
export const PUBLISH_NEWS_FEED = 'publish-newsfeed'
export async function publishNewsFeed(payload: { user_ids: string[]; kol: IHandleNewsFeedType }) {
  await pubSubServiceInstance.publish(PUBLISH_NEWS_FEED, payload)
}
