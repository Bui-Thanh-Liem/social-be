import { Router } from 'express'
import LikesController from '~/controllers/Likes.controller'
import { ToggleLikeDtoSchema } from '~/shared/dtos/req/like.dto'
import { checkTweetByIdParams } from '~/middlewares/checkTweetParams.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const likesRoute = Router()

likesRoute.post(
  '/toggle/:tweet_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ToggleLikeDtoSchema),
  checkTweetByIdParams,
  wrapAsyncHandler(LikesController.toggleLike)
)

export default likesRoute
