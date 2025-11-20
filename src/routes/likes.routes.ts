import { Router } from 'express'
import LikesController from '~/controllers/Likes.controller'
import { checkTweetByIdParams } from '~/middlewares/check-tweet-params.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const likesRoute = Router()

likesRoute.use(verifyAccessToken, verifyUserEmail)

likesRoute.post(
  '/toggle/:tweet_id',
  requestParamsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParams,
  asyncHandler(LikesController.toggleLike)
)

export default likesRoute
