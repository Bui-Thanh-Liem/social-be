import { NextFunction, Request, Response } from 'express'
import TweetsService from '~/services/Tweets.service'
import { NotFoundError } from '~/core/error.response'

// Y rang checkTweetParams nhưng sẽ query kiểm tra tồn tại và lấy audience thôi
export async function checkTweetParamsId(req: Request, res: Response, next: NextFunction) {
  try {
    const { tweet_id } = req.params as { tweet_id: string }

    if (!tweet_id) {
      throw new NotFoundError('Tweet_id is required')
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
