import { Router } from 'express'
import FollowsController from '~/controllers/Follows.controller'
import { checkUserParams } from '~/middlewares/check-user-params.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { UserIdDtoSchema } from '~/shared/dtos/req/user.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const followsRoute = Router()

followsRoute.post(
  '/toggle/:user_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(UserIdDtoSchema),
  checkUserParams,
  asyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
