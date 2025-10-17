import { NextFunction, Request, Response } from 'express'
import CommunityService from '~/services/Communities.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import { CreateCommunityDto } from '~/shared/dtos/req/community.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class CommunityController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as CreateCommunityDto
    const result = await CommunityService.create(user_id, payload)
    res.status(201).json(new CreatedResponse('Tạo cộng đồng thành công.', result))
  }

  async getMulti(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMulti({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng thành công`, result))
  }
}

export default new CommunityController()
