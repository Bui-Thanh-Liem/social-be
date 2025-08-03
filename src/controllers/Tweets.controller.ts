import { Request, Response } from 'express'
import TweetsService from '~/services/Tweets.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import { getNewFeedTypeDto, getTweetChildrenDtoBody, getTweetChildrenDtoParams } from '~/shared/dtos/req/tweet.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'

class TweetsController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await TweetsService.create(user_id, req.body)
    res.status(201).json(new CreatedResponse('Create tweet Success', result))
  }

  async getOneById(req: Request, res: Response) {
    const tweet = req.tweet as ITweet
    const user = req?.decoded_authorization as IJwtPayload
    const { guest_view, user_view, created_at } = await TweetsService.increaseView(tweet._id!, user?.user_id)

    tweet.guest_view = guest_view
    tweet.user_view = user_view
    tweet.created_at = created_at

    // Trả về ngay tại controller vì ở middleware đã query rồi
    res.status(200).json(new OkResponse('Get tweet Success', tweet))
  }

  async getTweetChildren(req: Request, res: Response) {
    const { tweet_type } = req.body as getTweetChildrenDtoBody
    const { tweet_id } = req.params as getTweetChildrenDtoParams
    const user = req?.decoded_authorization as IJwtPayload

    const tweets = await TweetsService.getTweetChildren({
      tweet_id,
      tweet_type,
      query: req.query,
      user_id: user.user_id
    })

    res.status(200).json(new OkResponse('Get tweet children Success', tweets))
  }

  async getNewFeeds(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const { feed_type } = req.params as getNewFeedTypeDto

    const result = await TweetsService.getNewFeeds({
      feed_type,
      query: req.query,
      user_id: user.user_id
    })
    res.status(200).json(new OkResponse('Get new feeds success', result))
  }
}

export default new TweetsController()
