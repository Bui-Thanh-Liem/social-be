import { Request, Response } from 'express'
import { GetOneTweetByIdDto } from '~/shared/dtos/req/tweet.dto'
import TweetsService from '~/services/Tweets.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class TweetsController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await TweetsService.create(user_id, req.body)
    res.status(201).json(new CreatedResponse('Create tweet Success', result))
  }

  async getOneById(req: Request, res: Response) {
    const { tweet_id } = req.params as GetOneTweetByIdDto
    const result = await TweetsService.getOneById(tweet_id)
    res.status(200).json(new OkResponse('Get tweet Success', result))
  }
}

export default new TweetsController()
