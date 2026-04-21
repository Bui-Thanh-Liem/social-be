import pubSubServiceInstance from '~/helpers/pub_sub.helper'
import NotificationGateway from '~/socket/gateways/notification.gateway'
import { PUBLISH_NEWS_FEED, PUBLISH_NOTIFICATION, PublishNotificationPayload } from './publisher'
import { IHandleNewsFeedType } from '~/shared/interfaces/common/handle-news-feed.interface'
import newsFeedGateway from '~/socket/gateways/news-feed.gateway'

// Hàm này lắng nghe sự kiện ở app chính
export async function initSubscriber() {
  //
  await pubSubServiceInstance.subscribe(
    PUBLISH_NOTIFICATION,
    async ({ new_noti, receiver_id }: PublishNotificationPayload) => {
      NotificationGateway.sendNotification(new_noti, receiver_id)
    }
  )

  //
  await pubSubServiceInstance.subscribe(
    PUBLISH_NEWS_FEED,
    async ({ user_ids, kol }: { user_ids: string[]; kol: IHandleNewsFeedType }) => {
      // Handle news feed publication logic here
      newsFeedGateway.sendInfoAuthFeed({ user_ids, kol })
    }
  )
}
