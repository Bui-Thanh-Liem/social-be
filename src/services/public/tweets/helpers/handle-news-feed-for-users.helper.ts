import { IHandleNewsFeedType } from '~/shared/interfaces/common/handle-news-feed.interface'
import followsService from '../../follows.service'
import cacheHelper from '~/helpers/cache.helper'
import { publishNewsFeed } from '~/helpers/pubsub/publisher'

export async function handleNewsFeedForUsers(data: IHandleNewsFeedType) {
  let skip = 0
  const chunk = 1000

  while (true) {
    const followed_user_ids = await followsService.getUserFollowerIds(data.kol?._id?.toString() || '', chunk, skip)

    if (!followed_user_ids.length) break

    const users = await cacheHelper.areUsersOnline(followed_user_ids.map((id) => id.toString()))

    const onlineUserIds = Object.keys(users).filter((id) => users[id])

    if (onlineUserIds.length) {
      await publishNewsFeed({ user_ids: onlineUserIds, kol: data })
      console.info(`Handled news feed for ${onlineUserIds.length} online users`)
    }

    skip += chunk
  }
}
