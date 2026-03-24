import { CONSTANT_EVENT_NAMES } from '~/shared/constants'
import { getIO } from '..'
import { ITweet } from '~/interfaces/tweets.interface'

class CommentGateway {
  async sendNewComment(comment: ITweet, receiverId: string) {
    const io = getIO()
    console.log('TweetGateway - sendNewComment:::', comment)

    //
    io.to(receiverId).emit(CONSTANT_EVENT_NAMES.NEW_COMMENT, comment)
  }
}

export default new CommentGateway()
