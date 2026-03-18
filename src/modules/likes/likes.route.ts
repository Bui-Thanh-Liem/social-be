import { Router } from 'express'
import LikesController from '~/modules/likes/likes.controller'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/tweet/check-tweet-exist.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const likesRoute = Router()

// Các route dưới đây cần authentication
likesRoute.use(authenticationMiddleware)

// Toggle like/unlike tweet
likesRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(LikesController.toggleLike)
)

export default likesRoute
