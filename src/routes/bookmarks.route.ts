import { Router } from 'express'
import bookmarksController from '~/controllers/bookmarks.controller'
import { paramIdTweetDtoSchema } from '~/dtos/tweets.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/tweet/check-tweet-exist.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const bookmarksRoute = Router()

// Thêm middleware
bookmarksRoute.use(authenticationMiddleware)

// Toggle bookmark
bookmarksRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(bookmarksController.toggleBookmark)
)

export default bookmarksRoute
