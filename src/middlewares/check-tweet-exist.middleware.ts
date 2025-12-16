import { NextFunction, Request, Response } from 'express'
import { NotFoundError } from '~/core/error.response'
import TweetsService from '~/services/Tweets.service'

// Y rang checkTweetParams nhưng sẽ query kiểm tra tồn tại và lấy author thôi
export async function checkTweetExist(req: Request, res: Response, next: NextFunction) {
  try {
    const { tweet_id } = req.params as { tweet_id: string }

    if (!tweet_id) {
      throw new NotFoundError('Bài viết không tồn tại.')
    }

    //
    const tweet = await TweetsService.getTweetOnlyUserId(tweet_id)
    req.tweet = tweet!

    //
    next()
  } catch (error) {
    next(error)
  }
}
