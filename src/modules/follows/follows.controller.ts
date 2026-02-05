import { Request, Response } from 'express'
import FollowsService from '~/modules/follows/follows.service'
import { OkResponse } from '~/core/success.response'
import { ToggleFollowDto } from '~/shared/dtos/req/user.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class FollowsController {
  async toggleFollow(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user_id: followed_user_id } = req.params as ToggleFollowDto
    const result = await FollowsService.toggleFollow(user_id, followed_user_id)
    res.json(new OkResponse(`Toggle follow Success`, result))
  }
}

export default new FollowsController()
