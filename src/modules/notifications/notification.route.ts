import { Router } from 'express'
import NotificationsController from '~/modules/notifications/notifications.controller'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { ParamIdNotiDtoSchema, GetMultiByTypeNotiDtoSchema } from '~/shared/dtos/req/notification.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const notificationRoute = Router()

notificationRoute.use(verifyAccessToken, verifyUserEmail)

notificationRoute.get(
  '/:type',
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMultiByTypeNotiDtoSchema),
  asyncHandler(NotificationsController.getMultiByType)
)

notificationRoute.patch(
  '/read/:noti_id',
  requestParamsValidate(ParamIdNotiDtoSchema),
  asyncHandler(NotificationsController.read)
)

notificationRoute.delete(
  '/:noti_id',
  requestParamsValidate(ParamIdNotiDtoSchema),
  asyncHandler(NotificationsController.delete)
)

export default notificationRoute
