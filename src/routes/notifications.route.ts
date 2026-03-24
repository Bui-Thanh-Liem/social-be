import { Router } from 'express'
import notificationsController from '~/controllers/notifications.controller'
import { GetMultiByTypeNotiDtoSchema, ParamIdNotiDtoSchema } from '~/dtos/notifications.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const notificationRoute = Router()

// Các route dưới đây cần authentication
notificationRoute.use(authenticationMiddleware)

// Lấy danh sách notification theo type
notificationRoute.get(
  '/:type',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiByTypeNotiDtoSchema),
  asyncHandler(notificationsController.getMultiByType)
)

// Đánh dấu notification đã đọc
notificationRoute.patch(
  '/read/:noti_id',
  paramsValidate(ParamIdNotiDtoSchema),
  asyncHandler(notificationsController.read)
)

// Xóa notification
notificationRoute.delete(
  '/:noti_id',
  paramsValidate(ParamIdNotiDtoSchema),
  asyncHandler(notificationsController.delete)
)

export default notificationRoute
