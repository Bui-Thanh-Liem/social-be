import { Router } from 'express'
import FollowsController from '~/modules/follows/follows.controller'
import { checkUserParams } from '~/shared/middlewares/user/check-user-params.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { UserIdDtoSchema } from '~/shared/dtos/req/user.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const followsRoute = Router()

followsRoute.use(verifyAccessToken, verifyUserEmail)

followsRoute.post(
  '/toggle/:user_id',
  requestParamsValidate(UserIdDtoSchema),
  checkUserParams,
  asyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
