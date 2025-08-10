import { NextFunction, Request, Response } from 'express'
import TweetsService from '~/services/Tweets.service'
import { NotFoundError } from '~/shared/classes/error.class'

export async function checkTweetByIdParams(req: Request, res: Response, next: NextFunction) {
  try {
    const { tweet_id } = req.params as { tweet_id: string }

    if (!tweet_id) {
      throw new NotFoundError('Tweet_id is required')
    }

    const tweet = await TweetsService.getOneById(tweet_id)
    if (!tweet) {
      throw new NotFoundError('Tweet không tồn tại')
    }

    req.tweet = tweet
    next()
  } catch (error) {
    next(error)
  }
}
