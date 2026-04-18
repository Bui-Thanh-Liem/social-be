import { NextFunction, Request, Response } from 'express'
import { NotFoundError } from '~/core/error.response'
import TweetsService from '~/services/public/tweets/tweets.service'

// Y rang checkTweetParams nhưng sẽ query kiểm tra tồn tại và lấy author thôi
export async function checkTweetExistMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params?.id as string

    if (!id) {
      throw new NotFoundError('Bài viết không tồn tại.')
    }

    //
    const tweet = await TweetsService.getTweetOnlyUserId(id)
    if (!tweet) {
      throw new NotFoundError('Bài viết không tồn tại.')
    }

    req.tweet = tweet!

    //
    next()
  } catch (error) {
    next(error)
  }
}
