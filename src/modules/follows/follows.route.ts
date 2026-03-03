import { Router } from 'express'
import FollowsController from '~/modules/follows/follows.controller'
import { UserIdDtoSchema } from '~/modules/users/users.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { checkUserParamsMiddleware } from '~/shared/middlewares/user/check-user-params.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const followsRoute = Router()

followsRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

followsRoute.post(
  '/toggle/:user_id',
  paramsValidate(UserIdDtoSchema),
  checkUserParamsMiddleware,
  asyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
