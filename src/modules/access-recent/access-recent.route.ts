import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import AccessRecentController from './access-recent.controller'
import { CreateAccessRecentDtoSchema, paramIdAccessRecentDtoSchema } from './access-recent.dto'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { paramsValidate } from '~/middlewares/params-validate.middleware'

const accessRecentRoute = Router()

// Tất cả route của access-recent đều cần authentication
accessRecentRoute.use(authenticationMiddleware)

// CRUD truy cập gần đây
accessRecentRoute
  .route('/')
  .get(queryValidate(QueryDtoSchema), asyncHandler(AccessRecentController.getMulti))
  .post(bodyValidate(CreateAccessRecentDtoSchema), asyncHandler(AccessRecentController.create))

// Xóa tất cả truy cập gần đây của user
accessRecentRoute.delete('/all', asyncHandler(AccessRecentController.deleteAll))

// Xóa truy cập gần đây
accessRecentRoute.delete(
  '/:access_recent_id',
  paramsValidate(paramIdAccessRecentDtoSchema),
  asyncHandler(AccessRecentController.delete)
)

export default accessRecentRoute
