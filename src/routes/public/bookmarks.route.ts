import { Router } from 'express'
import bookmarksController from '~/controllers/public/bookmarks.controller'
import { paramIdTweetDtoSchema } from '~/shared/dtos/public/tweets.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/public/tweet/check-tweet-exist.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module BookmarksRoutes
 * @description Quản lý danh sách các mục đã đánh dấu (bookmarks) của người dùng, bao gồm tạo, xóa và lấy danh sách các mục đã đánh dấu này.
 */

const bookmarksRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
bookmarksRoute.use(authenticationUserMiddleware)

/**
 * @description API để tạo hoặc xóa một mục đánh dấu (bookmark) cho một tweet cụ thể của người dùng. Nếu mục đánh dấu đã tồn tại, nó sẽ bị xóa; nếu chưa tồn tại, nó sẽ được tạo mới.
 * @method POST
 * @route /api/bookmarks/:tweet_id
 * @access Private
 */
bookmarksRoute.post(
  '/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(bookmarksController.toggleBookmark)
)

export default bookmarksRoute
