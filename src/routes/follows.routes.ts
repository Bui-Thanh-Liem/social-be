import { Router } from 'express'
import FollowsController from '~/controllers/Follows.controller'
import { checkUserParams } from '~/middlewares/checkUserParams.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { toggleFollowDtoSchema } from '~/shared/dtos/req/user.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const followsRoute = Router()

followsRoute.post(
  '/toggle/:user_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(toggleFollowDtoSchema),
  checkUserParams,
  wrapAsyncHandler(FollowsController.toggleFollow)
)

export default followsRoute
