import { Router } from 'express'
import CommunityController from '~/modules/communities/communities.controller'
import { checkExistMembers } from '~/shared/middlewares/community/check-exist-members.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import {
  ChangeInfoDtoSchema,
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
} from './communities.dto'

const communitiesRoute = Router()

// Thêm middleware xác thực
communitiesRoute.use(verifyAccessToken, verifyUserEmail)

// Tạo cộng đồng mới
communitiesRoute.post(
  '/',
  requestBodyValidate(CreateCommunityDtoSchema),
  checkExistMembers,
  asyncHandler(CommunityController.create)
)

// Cập nhật thông tin cộng đồng
communitiesRoute.patch(
  '/change-info/:community_id',
  requestBodyValidate(ChangeInfoDtoSchema),
  asyncHandler(CommunityController.changeInfo)
)

// Lấy categories của từng community (trả về danh sách)
communitiesRoute.get('/categories', asyncHandler(CommunityController.getAllCategories))

// Lấy danh sách name, id của cộng đồng
communitiesRoute.get('/bare', asyncHandler(CommunityController.getAllBare))

// Lấy danh sách slug, tên của cộng đồng đã ghim
communitiesRoute.get('/pinned-bare', asyncHandler(CommunityController.getPinnedBare))

// Ghim cộng đồng lên đầu trang1
communitiesRoute.patch(
  '/toggle-pin/:community_id',
  requestParamsValidate(PinCommunityDtoSchema),
  asyncHandler(CommunityController.togglePin)
)

// Mời ai đó vào cộng đồng (chỉ là thông báo)
// Trường hợp cộng đồng là "chỉ được mời" thì bắt buộc phải có
communitiesRoute.post(
  '/invite-members',
  requestBodyValidate(InvitationMembersDtoSchema),
  checkExistMembers,
  asyncHandler(CommunityController.inviteMembers)
)

//
communitiesRoute.post(
  '/join/:community_id',
  requestParamsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(CommunityController.join)
)

//
communitiesRoute.post(
  '/leave/:community_id',
  requestParamsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(CommunityController.leave)
)

//
communitiesRoute.post(
  '/promote',
  requestBodyValidate(PromoteMentorDtoSchema),
  asyncHandler(CommunityController.promoteMentor)
)

//
communitiesRoute.post(
  '/demote',
  requestBodyValidate(DemoteMentorDtoSchema),
  asyncHandler(CommunityController.demoteMentor)
)

//
communitiesRoute.post(
  '/change-status',
  requestBodyValidate(ChangeStatusTweetInCommunityDtoSchema),
  asyncHandler(CommunityController.changeStatusTweet)
)

//
communitiesRoute.patch('/update', requestBodyValidate(UpdateDtoSchema), asyncHandler(CommunityController.update))

// Lấy thông tin tổng quát một community theo slug
communitiesRoute.get(
  '/slug/:slug',
  requestParamsValidate(GetOneBySlugDtoSchema),
  asyncHandler(CommunityController.getOneBareInfoBySlug)
)

// Lấy thông tin chi tiết members mentors một community theo id
communitiesRoute.get(
  '/mm/:community_id',
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMMByIdDtoSchema),
  asyncHandler(CommunityController.getMultiMMById)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/invite/:community_id',
  requestParamsValidate(GetMultiInvitationsDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiInvitations)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/activity/:community_id',
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMultiActivityDtoSchema),
  asyncHandler(CommunityController.getMultiActivity)
)

// Xoá lời mời (ở cộng đồng "Chỉ được mời" sẽ không vào được)
communitiesRoute.delete(
  '/invite/:invitation_id/:community_id',
  requestParamsValidate(deleteInvitationDtoSchema),
  asyncHandler(CommunityController.deleteInvitation)
)

// Lấy những cộng đồng đã tạo
communitiesRoute.get('/owner', requestQueryValidate(QueryDtoSchema), asyncHandler(CommunityController.getMultiOwner))

// Lấy những cộng đồng đã tham gia
communitiesRoute.get('/joined', requestQueryValidate(QueryDtoSchema), asyncHandler(CommunityController.getMultiJoined))

// Lấy những cộng đồng
communitiesRoute.get(
  '/explore',
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiExplore)
)

export default communitiesRoute
