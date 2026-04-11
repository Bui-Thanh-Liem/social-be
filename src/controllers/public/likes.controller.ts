import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import { ParamIdTweetDto } from '~/dtos/public/tweets.dto'
import likesService from '~/services/public/likes.service'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class LikesController {
  async toggleLike(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await likesService.toggleLike(user_id, req.params as ParamIdTweetDto)
    res.status(201).json(new CreatedResponse('Toggle Like Success', result))
  }
}

export default new LikesController()
