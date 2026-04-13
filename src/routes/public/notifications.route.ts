import { Router } from 'express'
import notificationsController from '~/controllers/public/notifications.controller'
import { GetMultiByTypeNotiDtoSchema } from '~/shared/dtos/public/notifications.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module NotificationsRoutes
 * @description Quản lý các API liên quan đến thông báo (notifications) của người dùng, bao gồm lấy danh sách thông báo theo loại, đánh dấu đã đọc và xóa thông báo.
 */

const notificationRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
notificationRoute.use(authenticationUserMiddleware)

/** * @description API để lấy danh sách thông báo theo loại (type) của người dùng, có thể là thông báo về lượt thích, bình luận, theo dõi, v.v.
 * @method GET
 * @route /api/notifications/:type
 * @access Private
 */
notificationRoute.get(
  '/:type',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiByTypeNotiDtoSchema),
  asyncHandler(notificationsController.getMultiByType)
)

/**
 * @description API để đánh dấu một thông báo cụ thể là đã đọc.
 * @method PATCH
 * @route /api/notifications/read/:id
 * @access Private
 */
notificationRoute.patch('/read/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(notificationsController.read))

/**
 * @description API để xóa một thông báo cụ thể của người dùng.
 * @method DELETE
 * @route /api/notifications/:id
 * @access Private
 */
notificationRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(notificationsController.delete))

export default notificationRoute
