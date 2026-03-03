import { Router } from 'express'
import LikesController from '~/modules/likes/likes.controller'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/shared/middlewares/tweet/check-tweet-exist.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const likesRoute = Router()

likesRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

likesRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(LikesController.toggleLike)
)

export default likesRoute
