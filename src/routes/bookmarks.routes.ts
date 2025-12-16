import { Router } from 'express'
import BookmarksController from '~/controllers/Bookmarks.controller'
import { checkTweetExist } from '~/middlewares/check-tweet-exist.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { asyncHandler } from '~/utils/async-handler.util'
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
