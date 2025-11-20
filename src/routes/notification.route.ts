import { Router } from 'express'
import NotificationsController from '~/controllers/Notifications.controller'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
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
