import { Router } from 'express'
import FollowsController from '~/controllers/public/follows.controller'
import { UserIdDtoSchema } from '~/dtos/public/users.dto'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { checkUserParamsMiddleware } from '~/middlewares/public/user/check-user-params.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module FollowsRoutes
 * @description Quản lý các API liên quan đến việc theo dõi (follow) giữa người dùng, bao gồm theo dõi và hủy theo dõi người khác.
 */

const followsRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
followsRoute.use(authenticationUserMiddleware)

/**
 * @description API để theo dõi hoặc hủy theo dõi một người dùng khác. Nếu người dùng đã theo dõi mục tiêu, hành động này sẽ hủy theo dõi; nếu chưa theo dõi, nó sẽ tạo một mối quan hệ theo dõi mới.
 * @method POST
 * @route /api/follows/toggle/:user_id
 * @access Private
 */
followsRoute.post(
  '/toggle/:user_id',
  paramsValidate(UserIdDtoSchema),
  checkUserParamsMiddleware,
  asyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
