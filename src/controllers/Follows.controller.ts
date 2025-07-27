import { NextFunction, Request, Response } from 'express'
import { ToggleFollowDto } from '~/dtos/requests/user.dto'
import FollowsService from '~/services/Follows.service'
import { OkResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class FollowsController {
  async toggleFollow(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user_id: followed_user_id } = req.params as ToggleFollowDto
    const result = await FollowsService.toggleFollow(user_id, followed_user_id)
    res.json(new OkResponse(`Toggle follow Success`, result))
  }
}

export default new FollowsController()
