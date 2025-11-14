import { Router } from 'express'
import CommunityController from '~/controllers/Community.controller'
import { checkExistMembers } from '~/middlewares/check-exist-members.middleware'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import {
  ChangeStatusTweetInCommunityDtoSchema,
  CreateCommunityDtoSchema,
  deleteInvitationDtoSchema,
  DemoteMentorDtoSchema,
  GetMMByIdDtoSchema,
  GetMultiActivityDtoSchema,
  GetMultiInvitationsDtoSchema,
  GetOneBySlugDtoSchema,
  InvitationMembersDtoSchema,
  JoinLeaveCommunityDtoSchema,
  PinCommunityDtoSchema,
  PromoteMentorDtoSchema,
  UpdateDtoSchema
} from '~/shared/dtos/req/community.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const communitiesRoute = Router()

// Tạo cộng đồng mới
communitiesRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateCommunityDtoSchema),
  checkExistMembers,
  asyncHandler(CommunityController.create)
)

// Lấy categories của từng community (trả về danh sách)
communitiesRoute.get('/categories', verifyAccessToken, asyncHandler(CommunityController.getAllCategories))

// Lấy danh sách name, id của cộng đồng
communitiesRoute.get('/bare', verifyAccessToken, verifyUserEmail, asyncHandler(CommunityController.getAllBare))

// Ghim cộng đồng lên đầu trang
communitiesRoute.patch(
  '/toggle-pin/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(PinCommunityDtoSchema),
  asyncHandler(CommunityController.togglePin)
)

// Mời ai đó vào cộng đồng (chỉ là thông báo)
// Trường hợp cộng đồng là "chỉ được mời" thì bắt buộc phải có
communitiesRoute.post(
  '/invite-members',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(InvitationMembersDtoSchema),
  checkExistMembers,
  asyncHandler(CommunityController.inviteMembers)
)

//
communitiesRoute.post(
  '/join/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(CommunityController.join)
)

//
communitiesRoute.post(
  '/leave/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(CommunityController.leave)
)

//
communitiesRoute.post(
  '/promote',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(PromoteMentorDtoSchema),
  asyncHandler(CommunityController.promoteMentor)
)

//
communitiesRoute.post(
  '/demote',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(DemoteMentorDtoSchema),
  asyncHandler(CommunityController.demoteMentor)
)

//
communitiesRoute.post(
  '/change-status',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(ChangeStatusTweetInCommunityDtoSchema),
  asyncHandler(CommunityController.changeStatusTweet)
)

//
communitiesRoute.patch(
  '/update',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(UpdateDtoSchema),
  asyncHandler(CommunityController.update)
)

// Lấy thông tin tổng quát một community theo slug
communitiesRoute.get(
  '/slug/:slug',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(GetOneBySlugDtoSchema),
  asyncHandler(CommunityController.getOneBareInfoBySlug)
)

// Lấy thông tin chi tiết members mentors một community theo id
communitiesRoute.get(
  '/mm/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMMByIdDtoSchema),
  asyncHandler(CommunityController.getMultiMMById)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/invite/:community_id',
  verifyAccessToken,
  requestParamsValidate(GetMultiInvitationsDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiInvitations)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/activity/:community_id',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMultiActivityDtoSchema),
  asyncHandler(CommunityController.getMultiActivity)
)

// Xoá lời mời (ở cộng đồng "Chỉ được mời" sẽ không vào được)
communitiesRoute.delete(
  '/invite/:invitation_id/:community_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(deleteInvitationDtoSchema),
  asyncHandler(CommunityController.deleteInvitation)
)

// Lấy những cộng đồng đã tạo
communitiesRoute.get(
  '/owner',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiOwner)
)

// Lấy những cộng đồng đã tham gia
communitiesRoute.get(
  '/joined',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiJoined)
)

// Lấy những cộng đồng
communitiesRoute.get(
  '/explore',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiExplore)
)

export default communitiesRoute
