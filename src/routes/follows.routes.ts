import { Router } from 'express'
import FollowsController from '~/controllers/Follows.controller'
import { checkUserParams } from '~/middlewares/user/check-user-params.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/user/verify-user-email.middleware'
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
