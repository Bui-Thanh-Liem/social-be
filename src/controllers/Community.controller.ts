import { NextFunction, Request, Response } from 'express'
import CommunityService from '~/services/Communities.service'
import CommunityInvitationService from '~/services/Community-invitation.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import {
  ChangeStatusTweetInCommunityDto,
  CreateCommunityDto,
  deleteInvitationDto,
  DemoteMentorDto,
  GetMMByIdDto,
  GetMultiActivityDto,
  GetMultiInvitationsDto,
  GetOneBySlugDto,
  JoinLeaveCommunityDto,
  PinCommunityDto,
  PromoteMentorDto,
  UpdateDto
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
    const { user } = req
    const result = await CommunityService.join({ user_id, community_id, user })
    res.json(new CreatedResponse('Tham gia cộng đồng thành công.', result))
  }

  async leave(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { community_id } = req.params as JoinLeaveCommunityDto
    const { user } = req
    const result = await CommunityService.leave({ user_id, community_id, user })
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

  async update(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as UpdateDto
    const result = await CommunityService.update({ payload, user_id })
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

  async getMultiActivity(req: Request, res: Response, next: NextFunction) {
    const { community_id } = req.params as GetMultiActivityDto
    const result = await CommunityService.getMultiActivity({ community_id, queries: req.query })
    res.json(new OkResponse(`Lấy nhiều hoạt đông của cộng đồng thành công.`, result))
  }

  async getMultiJoined(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMultiJoined({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng bạn đã tham gia thành công.`, result))
  }

  async getMultiExplore(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMultiExplore({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng thành công.`, result))
  }

  async changeStatusTweet(req: Request, res: Response, next: NextFunction) {
    const { tweet_id, community_id, status } = req.body as ChangeStatusTweetInCommunityDto
    const result = await CommunityService.changeStatusTweet({ user_active: req.user!, community_id, tweet_id, status })
    res.json(new OkResponse(`Thay đổi trạng thái bài viết thành công.`, result))
  }

  async getOneBareInfoBySlug(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params as GetOneBySlugDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getOneBareInfoBySlug({ slug, user_id })
    res.json(new OkResponse(`Lấy cộng đồng bằng slug thành công.`, result))
  }

  async getMultiMMById(req: Request, res: Response, next: NextFunction) {
    const { community_id } = req.params as GetMMByIdDto
    const queries = req.query as IQuery<ICommunity>
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityService.getMultiMMById({ community_id, user_id, queries })
    res.json(new OkResponse(`Lấy thành viên và điều hành viên cộng đồng bằng id thành công.`, result))
  }

  async deleteInvitation(req: Request, res: Response, next: NextFunction) {
    const payload = req.params as deleteInvitationDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityInvitationService.delete({ user_id, payload })
    res.json(new OkResponse(`Xoá lời mời thành công.`, result))
  }

  async getMultiInvitations(req: Request, res: Response, next: NextFunction) {
    const { community_id } = req.params as GetMultiInvitationsDto
    const queries = req.query as IQuery<ICommunity>
    const result = await CommunityInvitationService.getMultiByCommunityId({ community_id, queries })
    res.json(new OkResponse(`Lấy tất cả lời mời thành công.`, result))
  }

  //
  async inviteMembers(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user } = req
    const result = await CommunityService.inviteMembers({ user_id, payload: req.body, user: user! })
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
