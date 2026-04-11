import { Router } from 'express'
import communitiesController from '~/controllers/public/communities.controller'
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
  PromoteMentorDtoSchema,
  UpdateDtoSchema
} from '~/dtos/public/communities.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { checkExistMembersMiddleware } from '~/middlewares/community/check-exist-members.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module CommunitiesRoutes
 * @description Quản lý các API liên quan đến cộng đồng, bao gồm tạo, cập nhật, tham gia, rời khỏi cộng đồng, v.v.
 */

const communitiesRoute = Router()

/**
 * @description API để lấy danh sách các cộng đồng để khám phá, có hỗ trợ phân trang và lọc. Nếu người dùng đã đăng nhập, nó sẽ ưu tiên hiển thị các cộng đồng liên quan đến sở thích của người dùng.
 * @method GET
 * @route /api/communities/explore
 * @access Public (ưu tiên hiển thị các cộng đồng liên quan đến sở thích nếu người dùng đã đăng nhập)
 */
communitiesRoute.get(
  '/explore',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(communitiesController.getMultiExplore)
)

/**
 * @description API để lấy thông tin chi tiết của một cộng đồng dựa trên slug của nó. Nếu người dùng đã đăng nhập, nó sẽ trả về thêm thông tin về trạng thái tham gia của người dùng đối với cộng đồng đó.
 * @method GET
 * @route /api/communities/slug/:slug
 * @access Public (trả về thêm thông tin về trạng thái tham gia nếu người dùng đã đăng nhập)
 */
communitiesRoute.get(
  '/slug/:slug',
  optionLogin(authenticationUserMiddleware),
  paramsValidate(GetOneBySlugDtoSchema),
  asyncHandler(communitiesController.getOneBareInfoBySlug)
)

/**
 * @description API để lấy danh sách các danh mục của cộng đồng.
 * @method GET
 * @route /api/communities/categories
 * @access Public
 */
communitiesRoute.get(
  '/categories',
  optionLogin(authenticationUserMiddleware),
  asyncHandler(communitiesController.getAllCategories)
)

/**
 * @description API để lấy danh sách slug, tên của cộng đồng đã ghim.
 * @method GET
 * @route /api/communities/pinned-bare
 * @access Public
 */
communitiesRoute.get(
  '/pinned-bare',
  optionLogin(authenticationUserMiddleware),
  asyncHandler(communitiesController.getPinnedBare)
)

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
communitiesRoute.use(authenticationUserMiddleware)

/**
 * @description API để tạo một cộng đồng mới. Người dùng có thể chỉ định các thành viên ban đầu của cộng đồng trong quá trình tạo. Nếu cộng đồng được tạo là "chỉ được mời", thì việc chỉ định thành viên ban đầu là bắt buộc.
 * @method POST
 * @route /api/communities
 * @access Private
 */
communitiesRoute.post(
  '/',
  bodyValidate(CreateCommunityDtoSchema),
  checkExistMembersMiddleware,
  asyncHandler(communitiesController.create)
)

/**
 * @description API để cập nhật thông tin của một cộng đồng.
 * @method PATCH
 * @route /api/communities/change-info/:community_id
 * @access Private
 */
communitiesRoute.patch(
  '/change-info/:community_id',
  bodyValidate(ChangeInfoDtoSchema),
  asyncHandler(communitiesController.changeInfo)
)

/**
 * @description API để lấy danh sách các cộng đồng với thông tin cơ bản (slug, tên, ...) mà không cần thông tin chi tiết như danh sách thành viên, bài viết, ... Điều này hữu ích cho các trường hợp cần hiển thị danh sách cộng đồng một cách nhanh chóng mà không cần tải quá nhiều dữ liệu.
 * @method GET
 * @route /api/communities/bare
 * @access Private
 */
communitiesRoute.get('/bare', asyncHandler(communitiesController.getAllBare))

/**
 * @description API để ghim hoặc bỏ ghim một cộng đồng. Chỉ chủ sở hữu của cộng đồng mới có quyền thực hiện hành động này.
 * @method PATCH
 * @route /api/communities/toggle-pin/:community_id
 * @access Private (chỉ chủ sở hữu cộng đồng)
 */
communitiesRoute.patch('/pin/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(communitiesController.togglePin))

/**
 * @description API để mời thành viên vào cộng đồng. Chỉ chủ sở hữu và mentor mới có quyền thực hiện hành động này. Nếu cộng đồng là "chỉ được mời", thì việc mời thành viên là cách duy nhất để họ có thể tham gia cộng đồng.
 * @method POST
 * @route /api/communities/invite-members
 * @access Private (chỉ chủ sở hữu và mentor)
 */
communitiesRoute.post(
  '/invite-members',
  bodyValidate(InvitationMembersDtoSchema),
  checkExistMembersMiddleware,
  asyncHandler(communitiesController.inviteMembers)
)

/**
 * @description API để tham gia một cộng đồng. Người dùng có thể tham gia cộng đồng nếu nó không phải là "chỉ được mời" hoặc nếu họ đã được mời.
 * @method POST
 * @route /api/communities/join/:community_id
 * @access Private
 */
communitiesRoute.post(
  '/join/:community_id',
  paramsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(communitiesController.join)
)

/**
 * @description API để rời khỏi một cộng đồng.
 * @method POST
 * @route /api/communities/leave/:community_id
 * @access Private
 */
communitiesRoute.post(
  '/leave/:community_id',
  paramsValidate(JoinLeaveCommunityDtoSchema),
  asyncHandler(communitiesController.leave)
)

/**
 * @description API để thăng chức thành mentor.
 * @method POST
 * @route /api/communities/promote
 * @access Private
 */
communitiesRoute.post(
  '/promote',
  bodyValidate(PromoteMentorDtoSchema),
  asyncHandler(communitiesController.promoteMentor)
)

/**
 * @description API để hạ chức mentor.
 * @method POST
 * @route /api/communities/demote
 * @access Private
 */
communitiesRoute.post('/demote', bodyValidate(DemoteMentorDtoSchema), asyncHandler(communitiesController.demoteMentor))

/**
 * @description API để thay đổi trạng thái của một bài viết trong cộng đồng (ví dụ: ghim bài viết lên đầu, bỏ ghim, đánh dấu là nội dung không phù hợp, ...)
 * @method POST
 * @route /api/communities/change-status
 * @access Private (chỉ chủ sở hữu và mentor mới có quyền thực hiện hành động này)
 */
communitiesRoute.post(
  '/change-status',
  bodyValidate(ChangeStatusTweetInCommunityDtoSchema),
  asyncHandler(communitiesController.changeStatusTweet)
)

/**
 * @description API để cập nhật thông tin của một cộng đồng.
 * @method PATCH
 * @route /api/communities/update
 * @access Private (chỉ chủ sở hữu và mentor mới có quyền thực hiện hành động này)
 */
communitiesRoute.patch('/update', bodyValidate(UpdateDtoSchema), asyncHandler(communitiesController.update))

/**
 * @description API để lấy danh sách các bài viết mới, thành viên mới, ... của một cộng đồng. Thông tin này hữu ích để hiển thị hoạt động gần đây của cộng đồng.
 * @method GET
 * @route /api/communities/activity/:community_id
 * @access Private (chỉ thành viên của cộng đồng mới có quyền truy cập)
 */
communitiesRoute.get(
  '/mm/:community_id',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMMByIdDtoSchema),
  asyncHandler(communitiesController.getMultiMMById)
)

/**
 * @description API để lấy danh sách các lời mời tham gia cộng đồng. Chỉ chủ sở hữu và mentor mới có quyền truy cập thông tin này.
 * @method GET
 * @route /api/communities/invite/:community_id
 * @access Private (chỉ chủ sở hữu và mentor mới có quyền truy cập)
 */
communitiesRoute.get(
  '/invite/:community_id',
  paramsValidate(GetMultiInvitationsDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(communitiesController.getMultiInvitations)
)

/**
 * @description API để lấy danh sách các hoạt động gần đây của cộng đồng, bao gồm bài viết mới, thành viên mới, ... Thông tin này hữu ích để hiển thị hoạt động gần đây của cộng đồng.
 * @method GET
 * @route /api/communities/activity/:community_id
 * @access Private (chỉ thành viên của cộng đồng mới có quyền truy cập)
 */
communitiesRoute.get(
  '/activity/:community_id',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiActivityDtoSchema),
  asyncHandler(communitiesController.getMultiActivity)
)

/**
 * @description API để xóa một lời mời tham gia cộng đồng. Chỉ chủ sở hữu và mentor mới có quyền thực hiện hành động này.
 * @method DELETE
 * @route /api/communities/invite/:invitation_id/:community_id
 * @access Private (chỉ chủ sở hữu và mentor mới có quyền thực hiện hành động này)
 */
communitiesRoute.delete(
  '/invite/:invitation_id/:community_id',
  paramsValidate(deleteInvitationDtoSchema),
  asyncHandler(communitiesController.deleteInvitation)
)

/**
 * @description API để lấy những cộng đồng mà người dùng là chủ sở hữu.
 * @method GET
 * @route /api/communities/owner
 * @access Private
 */
communitiesRoute.get('/owner', queryValidate(QueryDtoSchema), asyncHandler(communitiesController.getMultiOwner))

/**
 * @description API để lấy những cộng đồng mà người dùng đã tham gia.
 * @method GET
 * @route /api/communities/joined
 * @access Private
 */
communitiesRoute.get('/joined', queryValidate(QueryDtoSchema), asyncHandler(communitiesController.getMultiJoined))

export default communitiesRoute
