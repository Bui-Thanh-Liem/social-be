import { Router } from 'express'
import FollowsController from '~/controllers/follows.controller'
import { UserIdDtoSchema } from '~/dtos/users.dto'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { checkUserParamsMiddleware } from '~/middlewares/user/check-user-params.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const followsRoute = Router()

// Tất cả route của follows đều cần authentication
followsRoute.use(authenticationMiddleware)

// Toggle follow/unfollow user
followsRoute.post(
  '/toggle/:user_id',
  paramsValidate(UserIdDtoSchema),
  checkUserParamsMiddleware,
  asyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
