import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/tweet/check-tweet-exist.middleware'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import BookmarksController from './bookmarks.controller'

const bookmarksRoute = Router()

// Thêm middleware
bookmarksRoute.use(authenticationMiddleware)

// Toggle bookmark
bookmarksRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(BookmarksController.toggleBookmark)
)

export default bookmarksRoute
