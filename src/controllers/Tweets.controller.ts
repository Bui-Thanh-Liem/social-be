import { Request, Response } from 'express'
import TweetsService from '~/services/Tweets.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
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
    const { guest_view, user_view } = await TweetsService.increaseView(tweet._id!, user?.user_id)

    tweet.guest_view = guest_view
    tweet.user_view = user_view

    // Trả về ngay tại controller vì ở middleware đã query rồi
    res.status(200).json(new OkResponse('Get tweet Success', tweet))
  }
}

export default new TweetsController()
