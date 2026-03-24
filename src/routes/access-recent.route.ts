import { Router } from 'express'
import accessRecentController from '~/controllers/access-recent.controller'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { CreateAccessRecentDtoSchema, paramIdAccessRecentDtoSchema } from '../dtos/access-recent.dto'

const accessRecentRoute = Router()

// Tất cả route của access-recent đều cần authentication
accessRecentRoute.use(authenticationMiddleware)

// CRUD truy cập gần đây
accessRecentRoute
  .route('/')
  .get(queryValidate(QueryDtoSchema), asyncHandler(accessRecentController.getMulti))
  .post(bodyValidate(CreateAccessRecentDtoSchema), asyncHandler(accessRecentController.create))

// Xóa tất cả truy cập gần đây của user
accessRecentRoute.delete('/all', asyncHandler(accessRecentController.deleteAll))

// Xóa truy cập gần đây
accessRecentRoute.delete(
  '/:access_recent_id',
  paramsValidate(paramIdAccessRecentDtoSchema),
  asyncHandler(accessRecentController.delete)
)

export default accessRecentRoute
