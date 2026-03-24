import { Router } from 'express'
import likesController from '~/controllers/likes.controller'
import { paramIdTweetDtoSchema } from '~/dtos/tweets.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/tweet/check-tweet-exist.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const likesRoute = Router()

// Các route dưới đây cần authentication
likesRoute.use(authenticationMiddleware)

// Toggle like/unlike tweet
likesRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(likesController.toggleLike)
)

export default likesRoute
