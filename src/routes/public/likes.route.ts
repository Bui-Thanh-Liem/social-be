import { Router } from 'express'
import likesController from '~/controllers/public/likes.controller'
import { paramIdTweetDtoSchema } from '~/shared/dtos/public/tweets.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/public/tweet/check-tweet-exist.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module LikesRoutes
 * @description Quản lý các API liên quan đến lượt thích (likes) của người dùng đối với các tweet, bao gồm tạo, xóa và lấy danh sách các lượt thích này.
 */

const likesRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
likesRoute.use(authenticationUserMiddleware)

/**
 * @description API để tạo hoặc xóa một lượt thích (like) cho một tweet cụ thể của người dùng. Nếu lượt thích đã tồn tại, nó sẽ bị xóa; nếu chưa tồn tại, nó sẽ được tạo mới.
 * @method POST
 * @route /api/likes/toggle/:tweet_id
 * @access Private
 */
likesRoute.post(
  '/toggle/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(likesController.toggleLike)
)

export default likesRoute
