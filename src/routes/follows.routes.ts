import { Router } from 'express'
import FollowsController from '~/controllers/Follows.controller'
import { toggleFollowDtoSchema } from '~/dtos/requests/user.dto'
import { checkUserParams } from '~/middlewares/checkUserParams.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserActive } from '~/middlewares/verifyUserActive.middleware'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const followsRoute = Router()

followsRoute.post(
  '/toggle/:user_id',
  verifyAccessToken,
  verifyUserActive,
  requestParamsValidate(toggleFollowDtoSchema),
  checkUserParams,
  wrapAsyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
