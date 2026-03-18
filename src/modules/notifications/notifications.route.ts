import { Router } from 'express'
import NotificationsController from '~/modules/notifications/notifications.controller'
import { GetMultiByTypeNotiDtoSchema, ParamIdNotiDtoSchema } from '~/modules/notifications/notifications.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const notificationRoute = Router()

// Các route dưới đây cần authentication
notificationRoute.use(authenticationMiddleware)

// Lấy danh sách notification theo type
notificationRoute.get(
  '/:type',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiByTypeNotiDtoSchema),
  asyncHandler(NotificationsController.getMultiByType)
)

// Đánh dấu notification đã đọc
notificationRoute.patch(
  '/read/:noti_id',
  paramsValidate(ParamIdNotiDtoSchema),
  asyncHandler(NotificationsController.read)
)

// Xóa notification
notificationRoute.delete(
  '/:noti_id',
  paramsValidate(ParamIdNotiDtoSchema),
  asyncHandler(NotificationsController.delete)
)

export default notificationRoute
