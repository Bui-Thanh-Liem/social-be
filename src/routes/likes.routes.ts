import { Router } from 'express'
import LikesController from '~/controllers/Likes.controller'
import { ToggleLikeDtoSchema } from '~/dtos/requests/like.dto'
import { checkTweetParams } from '~/middlewares/checkTweetParams.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserActive } from '~/middlewares/verifyUserActive.middleware'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const likesRoute = Router()

likesRoute.post(
  '/toggle/:tweet_id',
  verifyAccessToken,
  verifyUserActive,
  requestParamsValidate(ToggleLikeDtoSchema),
  checkTweetParams,
  wrapAsyncHandler(LikesController.toggleLike)
)

export default likesRoute
