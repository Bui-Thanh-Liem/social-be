import { Request, Response } from 'express'
import TweetsService from '~/services/Tweets.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import { ParamDto } from '~/shared/dtos/req/param.dto'
import { getNewFeedTypeDto, getProfileTweetDto, getTweetChildrenDtoParams } from '~/shared/dtos/req/tweet.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'

class TweetsController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await TweetsService.create(user_id, req.body)
    res.status(201).json(new CreatedResponse('Đăng bài thành công', result))
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
    const { tweet_id, tweet_type } = req.params as unknown as getTweetChildrenDtoParams
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
      user_active_id: user.user_id
    })
    res.status(200).json(new OkResponse('Get new feeds success', result))
  }

  async getProfileTweets(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const { tweet_type } = req.params as unknown as getProfileTweetDto
    const queries = req.query as IQuery<ITweet>

    const result = await TweetsService.getProfileTweets({
      tweet_type,
      query: queries,
      user_active_id: user.user_id,
      isHighlight: queries?.ishl === '1',
      user_id: queries?.user_id as string
    })
    res.status(200).json(new OkResponse('Get profile tweet success', result))
  }

  async getTweetLiked(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const result = await TweetsService.getTweetLiked({
      query: req.query,
      user_active_id: user_id
    })
    res.status(200).json(new OkResponse('Get profile liked success', result))
  }

  async getTweetBookmarked(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const result = await TweetsService.getTweetBookmarked({
      query: req.query,
      user_active_id: user_id
    })
    res.status(200).json(new OkResponse('Get profile liked success', result))
  }

  async delete(req: Request, res: Response) {
    const { tweet_id } = req.params as ParamDto
    const result = await TweetsService.delete(tweet_id)
    res.status(200).json(new OkResponse('Xóa bài viết thành công', result))
  }
}

export default new TweetsController()
