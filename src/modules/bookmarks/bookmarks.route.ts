import { Router } from 'express'
import { checkTweetExist } from '~/shared/middlewares/tweet/check-tweet-exist.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import BookmarksController from './bookmarks.controller'
const bookmarksRoute = Router()

// Thêm middleware
bookmarksRoute.use(verifyAccessToken, verifyUserEmail)

//
bookmarksRoute.post(
  '/toggle/:tweet_id',
  requestParamsValidate(paramIdTweetDtoSchema),
  checkTweetExist,
  asyncHandler(BookmarksController.toggleBookmark)
)

export default bookmarksRoute
