import { Router } from 'express'
import NotificationsController from '~/modules/notifications/notifications.controller'
import { GetMultiByTypeNotiDtoSchema, ParamIdNotiDtoSchema } from '~/modules/notifications/notifications.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const notificationRoute = Router()

notificationRoute.use(authenticationMiddleware)

notificationRoute.get(
  '/:type',
  queryValidate(QueryDtoSchema),
  paramsValidate(GetMultiByTypeNotiDtoSchema),
  asyncHandler(NotificationsController.getMultiByType)
)

notificationRoute.patch(
  '/read/:noti_id',
  paramsValidate(ParamIdNotiDtoSchema),
  asyncHandler(NotificationsController.read)
)

notificationRoute.delete(
  '/:noti_id',
  paramsValidate(ParamIdNotiDtoSchema),
  asyncHandler(NotificationsController.delete)
)

export default notificationRoute
