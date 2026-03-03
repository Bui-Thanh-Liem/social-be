import { Router } from 'express'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/shared/middlewares/tweet/check-tweet-exist.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import BookmarksController from './bookmarks.controller'
const bookmarksRoute = Router()

// Thêm middleware
bookmarksRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

//
bookmarksRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(BookmarksController.toggleBookmark)
)

export default bookmarksRoute
