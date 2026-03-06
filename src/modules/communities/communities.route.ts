import { Router } from 'express'
import CommunityController from '~/modules/communities/communities.controller'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { checkExistMembersMiddleware } from '~/middlewares/community/check-exist-members.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
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
import { optionLogin } from '~/utils/option-login.middleware'

const communitiesRoute = Router()

// Lấy những cộng đồng
communitiesRoute.get('/explore', queryValidate(QueryDtoSchema), asyncHandler(CommunityController.getMultiExplore))

// Lấy thông tin tổng quát một community theo slug
communitiesRoute.get(
  '/slug/:slug',
  optionLogin(authenticationMiddleware),
  paramsValidate(GetOneBySlugDtoSchema),
  asyncHandler(CommunityController.getOneBareInfoBySlug)
)

// Thêm middleware xác thực
communitiesRoute.use(authenticationMiddleware)

// Tạo cộng đồng mới
communitiesRoute.post(
  '/',
  bodyValidate(CreateCommunityDtoSchema),
  checkExistMembersMiddleware,
  asyncHandler(CommunityController.create)
)

// Cập nhật thông tin cộng đồng
communitiesRoute.patch(
  '/change-info/:community_id',
  bodyValidate(ChangeInfoDtoSchema),
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
  paramsValidate(PinCommunityDtoSchema),
  asyncHandler(CommunityController.togglePin)
)

// Mời ai đó vào cộng đồng (chỉ là thông báo)
// Trường hợp cộng đồng là "chỉ được mời" thì bắt buộc phải có
communitiesRoute.post(
  '/invite-members',
  bodyValidate(InvitationMembersDtoSchema),
  checkExistMembersMiddleware,
  asyncHandler(CommunityController.inviteMembers)
)

//
communitiesRoute.post(
  '/join/:community_id',
  paramsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(CommunityController.join)
)

//
communitiesRoute.post(
  '/leave/:community_id',
  paramsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(CommunityController.leave)
)

//
communitiesRoute.post('/promote', bodyValidate(PromoteMentorDtoSchema), asyncHandler(CommunityController.promoteMentor))

//
communitiesRoute.post('/demote', bodyValidate(DemoteMentorDtoSchema), asyncHandler(CommunityController.demoteMentor))

//
communitiesRoute.post(
  '/change-status',
  bodyValidate(ChangeStatusTweetInCommunityDtoSchema),
  asyncHandler(CommunityController.changeStatusTweet)
)

//
communitiesRoute.patch('/update', bodyValidate(UpdateDtoSchema), asyncHandler(CommunityController.update))

// Lấy thông tin chi tiết members mentors một community theo id
communitiesRoute.get(
  '/mm/:community_id',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMMByIdDtoSchema),
  asyncHandler(CommunityController.getMultiMMById)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/invite/:community_id',
  paramsValidate(GetMultiInvitationsDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(CommunityController.getMultiInvitations)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/activity/:community_id',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiActivityDtoSchema),
  asyncHandler(CommunityController.getMultiActivity)
)

// Xoá lời mời (ở cộng đồng "Chỉ được mời" sẽ không vào được)
communitiesRoute.delete(
  '/invite/:invitation_id/:community_id',
  paramsValidate(deleteInvitationDtoSchema),
  asyncHandler(CommunityController.deleteInvitation)
)

// Lấy những cộng đồng đã tạo
communitiesRoute.get('/owner', queryValidate(QueryDtoSchema), asyncHandler(CommunityController.getMultiOwner))

// Lấy những cộng đồng đã tham gia
communitiesRoute.get('/joined', queryValidate(QueryDtoSchema), asyncHandler(CommunityController.getMultiJoined))

export default communitiesRoute
