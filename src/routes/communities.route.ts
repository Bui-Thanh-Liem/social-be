import { Router } from 'express'
import communitiesController from '~/controllers/communities.controller'
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
} from '~/dtos/communities.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { checkExistMembersMiddleware } from '~/middlewares/community/check-exist-members.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const communitiesRoute = Router()

// Lấy danh sách cộng đồng explore
communitiesRoute.get(
  '/explore',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(communitiesController.getMultiExplore)
)

// Lấy thông tin chi tiết một cộng đồng theo slug
communitiesRoute.get(
  '/slug/:slug',
  optionLogin(authenticationMiddleware),
  paramsValidate(GetOneBySlugDtoSchema),
  asyncHandler(communitiesController.getOneBareInfoBySlug)
)

// Lấy categories của từng community (trả về danh sách)
communitiesRoute.get(
  '/categories',
  optionLogin(authenticationMiddleware),
  asyncHandler(communitiesController.getAllCategories)
)

// Các route dưới đây cần authentication
communitiesRoute.use(authenticationMiddleware)

// Tạo cộng đồng mới
communitiesRoute.post(
  '/',
  bodyValidate(CreateCommunityDtoSchema),
  checkExistMembersMiddleware,
  asyncHandler(communitiesController.create)
)

// Cập nhật thông tin cộng đồng
communitiesRoute.patch(
  '/change-info/:community_id',
  bodyValidate(ChangeInfoDtoSchema),
  asyncHandler(communitiesController.changeInfo)
)

// Lấy danh sách name, id của cộng đồng
communitiesRoute.get('/bare', asyncHandler(communitiesController.getAllBare))

// Lấy danh sách slug, tên của cộng đồng đã ghim
communitiesRoute.get('/pinned-bare', asyncHandler(communitiesController.getPinnedBare))

// Ghim cộng đồng lên đầu trang1
communitiesRoute.patch(
  '/toggle-pin/:community_id',
  paramsValidate(PinCommunityDtoSchema),
  asyncHandler(communitiesController.togglePin)
)

// Mời ai đó vào cộng đồng (chỉ là thông báo)
// Trường hợp cộng đồng là "chỉ được mời" thì bắt buộc phải có
communitiesRoute.post(
  '/invite-members',
  bodyValidate(InvitationMembersDtoSchema),
  checkExistMembersMiddleware,
  asyncHandler(communitiesController.inviteMembers)
)

// Tham gia cộng đồng
communitiesRoute.post(
  '/join/:community_id',
  paramsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(communitiesController.join)
)

// Rời khỏi cộng đồng
communitiesRoute.post(
  '/leave/:community_id',
  paramsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(communitiesController.leave)
)

// Thăng chức thành mentor
communitiesRoute.post(
  '/promote',
  bodyValidate(PromoteMentorDtoSchema),
  asyncHandler(communitiesController.promoteMentor)
)

// Hạ chức mentor
communitiesRoute.post('/demote', bodyValidate(DemoteMentorDtoSchema), asyncHandler(communitiesController.demoteMentor))

// Thay đổi trạng thái bài viết trong cộng đồng (chỉ owner mới có quyền)
communitiesRoute.post(
  '/change-status',
  bodyValidate(ChangeStatusTweetInCommunityDtoSchema),
  asyncHandler(communitiesController.changeStatusTweet)
)

// Cập nhật các thiết lập khác của cộng đồng (không bao gồm thông tin cơ bản như tên, mô tả, ...)
communitiesRoute.patch('/update', bodyValidate(UpdateDtoSchema), asyncHandler(communitiesController.update))

// Lấy thông tin chi tiết members mentors một community theo id
communitiesRoute.get(
  '/mm/:community_id',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMMByIdDtoSchema),
  asyncHandler(communitiesController.getMultiMMById)
)

// Lấy những lời mời đã mời
communitiesRoute.get(
  '/invite/:community_id',
  paramsValidate(GetMultiInvitationsDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(communitiesController.getMultiInvitations)
)

// Lấy hoạt động của một cộng đồng (bài viết mới, thành viên mới, ...)
communitiesRoute.get(
  '/activity/:community_id',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiActivityDtoSchema),
  asyncHandler(communitiesController.getMultiActivity)
)

// Xoá lời mời (ở cộng đồng "Chỉ được mời" sẽ không vào được)
communitiesRoute.delete(
  '/invite/:invitation_id/:community_id',
  paramsValidate(deleteInvitationDtoSchema),
  asyncHandler(communitiesController.deleteInvitation)
)

// Lấy những cộng đồng đã tạo
communitiesRoute.get('/owner', queryValidate(QueryDtoSchema), asyncHandler(communitiesController.getMultiOwner))

// Lấy những cộng đồng đã tham gia
communitiesRoute.get('/joined', queryValidate(QueryDtoSchema), asyncHandler(communitiesController.getMultiJoined))

export default communitiesRoute
