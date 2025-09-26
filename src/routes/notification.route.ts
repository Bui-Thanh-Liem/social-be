import { Router } from 'express'
import NotificationsController from '~/controllers/Notifications.controller'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { GetMultiByTypeNotiDtoSchema } from '~/shared/dtos/req/notification.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const notificationRoute = Router()

notificationRoute.get(
  '/:type',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  requestParamsValidate(GetMultiByTypeNotiDtoSchema),
  wrapAsyncHandler(NotificationsController.getMultiByType)
)

export default notificationRoute
