import { Request, Response } from 'express'
import { ToggleLikeDto } from '~/shared/dtos/req/like.dto'
import LikesService from '~/services/Likes.service'
import { CreatedResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class LikesController {
  async toggleLike(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await LikesService.toggleLike(user_id, req.params as ToggleLikeDto)
    res.status(201).json(new CreatedResponse('Toggle Like Success', result))
  }
}

export default new LikesController()
