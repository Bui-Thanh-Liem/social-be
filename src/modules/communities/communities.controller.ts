import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'

import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import CommunityInvitationService from './community-invitation.service'
import communitiesService from './communities.service'
import {
  ChangeInfoDto,
  ChangeStatusTweetInCommunityDto,
  CreateCommunityDto,
  DeleteInvitationDto,
  DemoteMentorDto,
  GetMMByIdDto,
  GetMultiActivityDto,
  GetMultiInvitationsDto,
  GetOneBySlugDto,
  JoinLeaveCommunityDto,
  PinCommunityDto,
  PromoteMentorDto,
  UpdateDto
} from './communities.dto'
import { ICommunity } from './communities.interface'

class CommunityController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as CreateCommunityDto
    const result = await communitiesService.create(user_id, payload)
    res.json(new CreatedResponse('Tạo cộng đồng thành công.', result))
  }

  async changeInfo(req: Request, res: Response) {
    const { community_id } = req.params as { community_id: string }
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as ChangeInfoDto
    const result = await communitiesService.changeInfo({ community_id, payload, user_id })
    res.json(new CreatedResponse('Cập nhật thông tin cộng đồng thành công.', result))
  }

  async join(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { community_id } = req.params as JoinLeaveCommunityDto
    const { user } = req
    const result = await communitiesService.join({ user_id, community_id, user })
    res.json(new CreatedResponse('Tham gia cộng đồng thành công.', result))
  }

  async leave(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { community_id } = req.params as JoinLeaveCommunityDto
    const { user } = req
    const result = await communitiesService.leave({ user_id, community_id, user })
    res.json(new CreatedResponse('Rời cộng đồng thành công.', result))
  }

  async promoteMentor(req: Request, res: Response) {
    const { user_id: actor_id } = req.decoded_authorization as IJwtPayload
    const { user_id: target_id, community_id } = req.body as PromoteMentorDto
    const result = await communitiesService.promoteMentor({ actor_id, target_id, community_id })
    res.json(new CreatedResponse('Cho thành viên lên điều hành viên thành công.', result))
  }

  async demoteMentor(req: Request, res: Response) {
    const { user_id: actor_id } = req.decoded_authorization as IJwtPayload
    const { user_id: target_id, community_id } = req.body as DemoteMentorDto
    const result = await communitiesService.demoteMentor({ actor_id, target_id, community_id })
    res.json(new CreatedResponse('Cho điều hành viên xuống thành viên thành công.', result))
  }

  async update(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const payload = req.body as UpdateDto
    const result = await communitiesService.update({ payload, user_id })
    res.json(new CreatedResponse('Thay đổi cài đặt tham gia thành công.', result))
  }

  async getAllCategories(req: Request, res: Response) {
    const result = await communitiesService.getAllCategories()
    res.json(new OkResponse(`Lấy nhiều danh mục cộng đồng thành công.`, result))
  }

  async getAllBare(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getAllBare(user_id)
    res.json(new OkResponse(`Lấy danh sách id và tên cộng đồng thành công.`, result))
  }

  async getPinnedBare(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getPinnedBare(user_id)
    res.json(new OkResponse(`Lấy danh sách slug và tên cộng đồng thành công.`, result))
  }

  async getMultiOwner(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getMultiOwner({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng của bạn thành công.`, result))
  }

  async getMultiActivity(req: Request, res: Response) {
    const { community_id } = req.params as GetMultiActivityDto
    const result = await communitiesService.getMultiActivity({ community_id, queries: req.query })
    res.json(new OkResponse(`Lấy nhiều hoạt đông của cộng đồng thành công.`, result))
  }

  async getMultiJoined(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getMultiJoined({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng bạn đã tham gia thành công.`, result))
  }

  async getMultiExplore(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getMultiExplore({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cộng đồng thành công.`, result))
  }

  async changeStatusTweet(req: Request, res: Response) {
    const { tweet_id, community_id, status } = req.body as ChangeStatusTweetInCommunityDto
    const result = await communitiesService.changeStatusTweet({
      user_active: req.user!,
      community_id,
      tweet_id,
      status
    })
    res.json(new OkResponse(`Thay đổi trạng thái bài viết thành công.`, result))
  }

  async getOneBareInfoBySlug(req: Request, res: Response) {
    const { slug } = req.params as GetOneBySlugDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getOneBareInfoBySlug({ slug, user_id })
    res.json(new OkResponse(`Lấy cộng đồng bằng slug thành công.`, result))
  }

  async getMultiMMById(req: Request, res: Response) {
    const { community_id } = req.params as GetMMByIdDto
    const queries = req.query as IQuery<ICommunity>
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await communitiesService.getMultiMMById({ community_id, user_id, queries })
    res.json(new OkResponse(`Lấy thành viên và điều hành viên cộng đồng bằng id thành công.`, result))
  }

  async deleteInvitation(req: Request, res: Response) {
    const payload = req.params as DeleteInvitationDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await CommunityInvitationService.delete({ user_id, payload })
    res.json(new OkResponse(`Xoá lời mời thành công.`, result))
  }

  async getMultiInvitations(req: Request, res: Response) {
    const { community_id } = req.params as GetMultiInvitationsDto
    const queries = req.query as IQuery<ICommunity>
    const result = await CommunityInvitationService.getMultiByCommunityId({ community_id, queries })
    res.json(new OkResponse(`Lấy tất cả lời mời thành công.`, result))
  }

  //
  async inviteMembers(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { user } = req
    const result = await communitiesService.inviteMembers({ user_id, payload: req.body, user: user! })
    res.json(new OkResponse(`Mời thành viên vào cộng đồng thành công.`, result))
  }

  //
  async togglePin(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const params = req.params as PinCommunityDto
    const result = await communitiesService.togglePin({ user_id, community_id: params.community_id })
    res.json(new OkResponse(`${result.status} cộng đồng thành công.`, result))
  }
}

export default new CommunityController()
