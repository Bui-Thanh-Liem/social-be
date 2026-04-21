import { getIO } from '..'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants/socket.constant'
import { IHandleNewsFeedType } from '~/shared/interfaces/common/handle-news-feed.interface'

class NewsFeedGateway {
  async sendInfoAuthFeed({ user_ids, kol }: { user_ids: string[]; kol: IHandleNewsFeedType }) {
    const io = getIO()

    //
    user_ids.forEach((user_id) => {
      io.to(user_id).emit(CONSTANT_EVENT_NAMES.USER_NEWS_FEED, kol)
    })
  }
}

export default new NewsFeedGateway()
