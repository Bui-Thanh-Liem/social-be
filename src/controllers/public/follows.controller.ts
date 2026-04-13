import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { ToggleFollowDto } from '~/shared/dtos/public/users.dto'
import followsService from '~/services/public/follows.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class FollowsController {
  async toggleFollow(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user_id: followed_user_id } = req.params as ToggleFollowDto
    const result = await followsService.toggleFollow(user_id, followed_user_id)
    res.json(new OkResponse(`Thành công`, result))
  }
}

export default new FollowsController()
