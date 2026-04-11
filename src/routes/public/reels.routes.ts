import { Router } from 'express'
import reelsController from '~/controllers/public/reels.controller'
import { ChangeStatusReelDtoSchema, CreateReelDtoSchema } from '~/dtos/public/reels.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'

/**
 * @module ReelsRoutes
 * @description Quản lý các API liên quan đến reels, bao gồm tạo mới, thay đổi trạng thái, xóa reels và lấy danh sách reels cho feed và profile.
 */

const reelRoute = Router()

/**
 * @description API để lấy danh sách reels mới nhất cho feed của người dùng, có hỗ trợ phân trang. Nếu người dùng đã đăng nhập, nó sẽ ưu tiên hiển thị các reels từ những người mà người dùng đang theo dõi.
 * @method GET
 * @route /api/reels/feeds
 * @access Public (ưu tiên hiển thị reels từ những người đang theo dõi nếu người dùng đã đăng nhập)
 */
reelRoute.get(
  '/feeds',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  reelsController.getNewFeed
)

/**
 * @description API để lấy danh sách reels của một người dùng cụ thể dựa trên ID của họ, có hỗ trợ phân trang. Nếu người dùng đã đăng nhập, nó sẽ trả về thêm thông tin về trạng thái tương tác của người dùng đối với từng reel (đã thích, đã lưu, v.v.).
 * @method GET
 * @route /api/reels/profile/:id
 * @access Public (trả về thêm thông tin về trạng thái tương tác nếu người dùng đã đăng nhập)
 */
reelRoute.get(
  '/profile/:id',
  optionLogin(authenticationUserMiddleware),
  paramsValidate(ParamIdDtoSchema),
  queryValidate(QueryDtoSchema),
  reelsController.getProfileReels
)

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
reelRoute.use(authenticationUserMiddleware)

/**
 * @description API để tạo một reel mới cho người dùng. Người dùng có thể tải lên video, thêm mô tả và thiết lập quyền riêng tư cho reel của họ.
 * @method POST
 * @route /api/reels
 * @access Private
 */
reelRoute.post('/', bodyValidate(CreateReelDtoSchema), reelsController.create)

/**
 * @description API để thay đổi trạng thái của một reel cụ thể, chẳng hạn như chuyển từ công khai sang riêng tư hoặc ngược lại. Chỉ chủ sở hữu của reel mới có thể thực hiện hành động này.
 * @method PATCH
 * @route /api/reels/:id/status
 * @access Private (chỉ chủ sở hữu của reel mới có thể thay đổi trạng thái)
 */
reelRoute.patch(
  '/:id/status',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(ChangeStatusReelDtoSchema),
  reelsController.changeStatusReel
)

/**
 * @description API để xóa một reel cụ thể của người dùng. Chỉ chủ sở hữu của reel mới có thể thực hiện hành động này.
 * @method DELETE
 * @route /api/reels/:id
 * @access Private (chỉ chủ sở hữu của reel mới có thể xóa)
 */
reelRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), reelsController.delete)

export default reelRoute
