import { Router } from 'express'
import BookmarksController from '~/controllers/Bookmarks.controller'
import { checkTweetByIdParams } from '~/middlewares/checkTweetParams.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { ToggleBookmarkDtoSchema } from '~/shared/dtos/req/bookmark.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const bookmarksRoute = Router()

bookmarksRoute.post(
  '/toggle/:tweet_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ToggleBookmarkDtoSchema),
  checkTweetByIdParams,
  wrapAsyncHandler(BookmarksController.toggleBookmark)
)

export default bookmarksRoute
