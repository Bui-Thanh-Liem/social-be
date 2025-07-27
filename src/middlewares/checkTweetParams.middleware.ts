import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { NotFoundError } from '~/shared/classes/error.class'

export async function checkTweetParams(req: Request, res: Response, next: NextFunction) {
  try {
    const { tweet_id } = req.params as { tweet_id: string }

    if (!tweet_id) {
      throw new NotFoundError('Tweet_id is required')
    }

    const tweet = await TweetCollection.findOne(
      { _id: new ObjectId(tweet_id) },
      { projection: { _id: 1, user_id: 1, audience: 1 } }
    )

    if (!tweet) {
      throw new NotFoundError('Tweet không tồn tại')
    }

    req.tweet = tweet
    next()
  } catch (error) {
    next(error)
  }
}
