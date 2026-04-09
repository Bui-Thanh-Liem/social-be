import { Router } from 'express'
import accessRecentController from '~/controllers/access-recents.controller'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { CreateAccessRecentDtoSchema, paramIdAccessRecentDtoSchema } from '../dtos/access-recent.dto'
import { optionLogin } from '~/middlewares/option-login.middleware'

const accessRecentRoute = Router()

// CRUD truy cập gần đây
accessRecentRoute
  .route('/')
  .get(
    queryValidate(QueryDtoSchema),
    optionLogin(authenticationMiddleware),
    asyncHandler(accessRecentController.getMulti)
  )
  .post(
    bodyValidate(CreateAccessRecentDtoSchema),
    authenticationMiddleware,
    asyncHandler(accessRecentController.create)
  )

// Tất cả route của access-recent đều cần authentication
accessRecentRoute.use(authenticationMiddleware)

// Xóa tất cả truy cập gần đây của user
accessRecentRoute.delete('/all', asyncHandler(accessRecentController.deleteAll))

// Xóa truy cập gần đây
accessRecentRoute.delete(
  '/:access_recent_id',
  paramsValidate(paramIdAccessRecentDtoSchema),
  asyncHandler(accessRecentController.delete)
)

export default accessRecentRoute
