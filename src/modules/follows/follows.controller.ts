import { Request, Response } from 'express'
import FollowsService from '~/modules/follows/follows.service'
import { OkResponse } from '~/core/success.response'
import { ToggleFollowDto } from '~/modules/users/users.dto'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class FollowsController {
  async toggleFollow(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user_id: followed_user_id } = req.params as ToggleFollowDto
    const result = await FollowsService.toggleFollow(user_id, followed_user_id)
    res.json(new OkResponse(`Thành công`, result))
  }
}

export default new FollowsController()
