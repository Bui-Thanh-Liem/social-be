import { Router } from 'express'
import CommunityController from '~/controllers/Community.controller'
import { checkExistMembers } from '~/middlewares/checkExistMembers.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import {
  ChangeMembershipTypeDtoSchema,
  ChangeVisibilityTypeDtoSchema,
  CreateCommunityDtoSchema,
  DemoteMentorDtoSchema,
  GetMMByIdDtoSchema,
  GetOneBySlugDtoSchema,
  InvitationMembersDtoSchema,
  JoinLeaveCommunityDtoSchema,
  PinCommunityDtoSchema,
  PromoteMentorDtoSchema
} from '~/shared/dtos/req/community.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const communitiesRoute = Router()

// Tạo cộng  đồng mới
communitiesRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateCommunityDtoSchema),
  checkExistMembers,
  wrapAsyncHandler(CommunityController.create)
)

// Lấy categories của từng community (trả về danh sách)
communitiesRoute.get('/categories', verifyAccessToken, wrapAsyncHandler(CommunityController.getAllCategories))

// Lấy danh sách name, id của cộng đồng
communitiesRoute.get('/bare', verifyAccessToken, verifyUserEmail, wrapAsyncHandler(CommunityController.getAllBare))

// Ghim cộng đồng lên đầu trang
communitiesRoute.patch(
  '/toggle-pin/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(PinCommunityDtoSchema),
  wrapAsyncHandler(CommunityController.togglePin)
)

// Mời ai đó vào cộng đồng (chỉ là thông báo)
// Trường hợp cộng đồng là "chỉ được mời" thì bắt buộc phải có
communitiesRoute.post(
  '/invite-members',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(InvitationMembersDtoSchema),
  checkExistMembers,
  wrapAsyncHandler(CommunityController.inviteMembers)
)

//
communitiesRoute.post(
  '/join/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(JoinLeaveCommunityDtoSchema),
  wrapAsyncHandler(CommunityController.join)
)

//
communitiesRoute.post(
  '/leave/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(JoinLeaveCommunityDtoSchema),
  wrapAsyncHandler(CommunityController.leave)
)

//
communitiesRoute.post(
  '/promote',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(PromoteMentorDtoSchema),
  wrapAsyncHandler(CommunityController.promoteMentor)
)

//
communitiesRoute.post(
  '/demote',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(DemoteMentorDtoSchema),
  wrapAsyncHandler(CommunityController.demoteMentor)
)

//
communitiesRoute.post(
  '/change-membership-type',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(ChangeMembershipTypeDtoSchema),
  wrapAsyncHandler(CommunityController.changeMembershipType)
)

//
communitiesRoute.post(
  '/change-visibility-type',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(ChangeVisibilityTypeDtoSchema),
  wrapAsyncHandler(CommunityController.changeVisibilityType)
)

// Lấy thông tin tổng quát một community theo slug
communitiesRoute.get(
  '/slug/:slug',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(GetOneBySlugDtoSchema),
  wrapAsyncHandler(CommunityController.getOneBareInfoBySlug)
)

// Lấy thông tin chi tiết members mentors một community theo id
communitiesRoute.get(
  '/mm/:id',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMMByIdDtoSchema),
  wrapAsyncHandler(CommunityController.getMMById)
)

// Lấy những cộng đồng đã tạo
communitiesRoute.get(
  '/owner',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(CommunityController.getMultiOwner)
)

// Lấy những cộng đồ đã tham gia
communitiesRoute.get(
  '/joined',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(CommunityController.getMultiJoined)
)

export default communitiesRoute
