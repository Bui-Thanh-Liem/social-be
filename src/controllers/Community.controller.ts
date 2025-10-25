import { NextFunction, Request, Response } from 'express'
import CommunityService from '~/services/Communities.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import { CreateCommunityDto, GetOneBySlugDto, PinCommunityDto } from '~/shared/dtos/req/community.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class CommunityController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as CreateCommunityDto
    const result = await CommunityService.create(user_id, payload)
    res.status(201).json(new CreatedResponse('Tạo cộng đồng thành công.', result))
  }

  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    const result = await CommunityService.getAllCategories()
    res.json(new OkResponse(`Lấy nhiều danh mục cộng đồng thành công.`, result))
  }

  async getMultiOwner(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMultiOwner({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng của bạn thành công.`, result))
  }

  async getMultiJoined(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMultiJoined({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng bạn đã tham gia thành công.`, result))
  }

  async getOneBySlug(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params as GetOneBySlugDto
    const result = await CommunityService.getOneBySlug(slug)
    res.json(new OkResponse(`Lấy cộng đồng bằng slug thành công.`, result))
  }

  //
  async inviteMembers(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.inviteMembers({ user_id, payload: req.body })
    res.json(new OkResponse(`Mời thành viên vào cộng đồng thành công.`, result))
  }

  //
  async togglePinCommunity(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const params = req.params as PinCommunityDto
    const result = await CommunityService.togglePinCommunity({ user_id, community_id: params.community_id })
    res.json(new OkResponse(`${result.status} cộng đồng thành công.`, result))
  }
}

export default new CommunityController()
