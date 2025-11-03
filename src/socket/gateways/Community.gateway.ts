import TweetsService from '~/services/Tweets.service'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { getIO } from '..'

class CommunityGateway {
  async sendCountTweetApprove(receiverId: string) {
    const io = getIO()
    const count = await TweetsService.getCountTweetApprove({ community_id: receiverId })
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.COUNT_TWEET_APPROVE, count)
  }
}

export default new CommunityGateway()
