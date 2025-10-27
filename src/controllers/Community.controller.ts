import { NextFunction, Request, Response } from 'express'
import CommunityService from '~/services/Communities.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import {
  ChangeMembershipTypeDto,
  ChangeVisibilityTypeDto,
  CreateCommunityDto,
  DemoteMentorDto,
  GetMMByIdDto,
  GetOneBySlugDto,
  JoinLeaveCommunityDto,
  PinCommunityDto,
  PromoteMentorDto
} from '~/shared/dtos/req/community.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'

class CommunityController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as CreateCommunityDto
    const result = await CommunityService.create(user_id, payload)
    res.json(new CreatedResponse('Tạo cộng đồng thành công.', result))
  }

  async join(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { community_id } = req.params as JoinLeaveCommunityDto
    const result = await CommunityService.join({ user_id, community_id })
    res.json(new CreatedResponse('Tham gia cộng đồng thành công.', result))
  }

  async leave(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { community_id } = req.params as JoinLeaveCommunityDto
    const result = await CommunityService.leave({ user_id, community_id })
    res.json(new CreatedResponse('Rời cộng đồng thành công.', result))
  }

  async promoteMentor(req: Request, res: Response) {
    const { user_id: actor_id } = req.decoded_authorization as IJwtPayload
    const { user_id: target_id, community_id } = req.body as PromoteMentorDto
    const result = await CommunityService.promoteMentor({ actor_id, target_id, community_id })
    res.json(new CreatedResponse('Cho thành viên lên điều hành viên thành công.', result))
  }

  async demoteMentor(req: Request, res: Response) {
    const { user_id: actor_id } = req.decoded_authorization as IJwtPayload
    const { user_id: target_id, community_id } = req.body as DemoteMentorDto
    const result = await CommunityService.demoteMentor({ actor_id, target_id, community_id })
    res.json(new CreatedResponse('Cho điều hành viên xuống thành viên thành công.', result))
  }

  async changeMembershipType(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { membershipType, community_id } = req.body as ChangeMembershipTypeDto
    const result = await CommunityService.changeMembershipType({ user_id, membershipType, community_id })
    res.json(new CreatedResponse('Thay đổi cài đặt tham gia thành công.', result))
  }

  async changeVisibilityType(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { visibilityType, community_id } = req.body as ChangeVisibilityTypeDto
    const result = await CommunityService.changeVisibilityType({ user_id, visibilityType, community_id })
    res.json(new CreatedResponse('Thay đổi cài đặt tham gia thành công.', result))
  }

  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    const result = await CommunityService.getAllCategories()
    res.json(new OkResponse(`Lấy nhiều danh mục cộng đồng thành công.`, result))
  }

  async getAllBare(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getAllBare(user_id)
    res.json(new OkResponse(`Lấy danh sách id và tên cộng đồng thành công.`, result))
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

  async getOneBareInfoBySlug(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params as GetOneBySlugDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getOneBareInfoBySlug({ slug, user_id })
    res.json(new OkResponse(`Lấy cộng đồng bằng slug thành công.`, result))
  }

  async getMMById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as GetMMByIdDto
    const queries = req.query as IQuery<ICommunity>
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMMById({ id, user_id, queries })
    res.json(new OkResponse(`Lấy thành viên và điều hành viên cộng đồng bằng id thành công.`, result))
  }

  //
  async inviteMembers(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.inviteMembers({ user_id, payload: req.body })
    res.json(new OkResponse(`Mời thành viên vào cộng đồng thành công.`, result))
  }

  //
  async togglePin(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const params = req.params as PinCommunityDto
    const result = await CommunityService.togglePin({ user_id, community_id: params.community_id })
    res.json(new OkResponse(`${result.status} cộng đồng thành công.`, result))
  }
}

export default new CommunityController()
