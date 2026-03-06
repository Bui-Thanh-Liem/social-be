import { NextFunction, Request, Response } from 'express'
import TweetsService from '~/modules/tweets/tweets.service'
import { NotFoundError } from '~/core/error.response'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

export async function checkTweetByIdParamsMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req?.decoded_authorization as IJwtPayload
    const { tweet_id } = req.params as { tweet_id: string }

    if (!tweet_id) {
      throw new NotFoundError('Bài viết không tồn tại')
    }

    const tweet = await TweetsService.getOneById({ tweet_id, user_active_id: auth?.user_id })
    if (!tweet) {
      throw new NotFoundError('Bài viết không tồn tại')
    }

    req.tweet = tweet
    next()
  } catch (error) {
    next(error)
  }
}
