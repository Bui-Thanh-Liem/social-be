import { Router } from 'express'
import LikesController from '~/modules/likes/likes.controller'
import { checkTweetExist } from '~/shared/middlewares/tweet/check-tweet-exist.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const likesRoute = Router()

likesRoute.use(verifyAccessToken, verifyUserEmail)

likesRoute.post(
  '/toggle/:tweet_id',
  requestParamsValidate(paramIdTweetDtoSchema),
  checkTweetExist,
  asyncHandler(LikesController.toggleLike)
)

export default likesRoute
