import { Router } from 'express'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/tweet/check-tweet-exist.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import BookmarksController from './bookmarks.controller'
const bookmarksRoute = Router()

// Thêm middleware
bookmarksRoute.use(authenticationMiddleware)

//
bookmarksRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(BookmarksController.toggleBookmark)
)

export default bookmarksRoute
