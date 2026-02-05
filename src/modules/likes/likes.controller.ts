import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import { ParamIdTweetDto } from '~/modules/tweets/tweets.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import LikesService from './likes.service'

class LikesController {
  async toggleLike(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await LikesService.toggleLike(user_id, req.params as ParamIdTweetDto)
    res.status(201).json(new CreatedResponse('Toggle Like Success', result))
  }
}

export default new LikesController()
