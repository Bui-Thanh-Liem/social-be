import { Router } from 'express'
import HashtagsController from '~/controllers/public/hashtags.controller'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module HashtagsRoutes
 * @description Quản lý các API liên quan đến hashtag, bao gồm lấy danh sách các hashtag phổ biến hoặc liên quan đến một chủ đề cụ thể.
 */

const hashtagsRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
hashtagsRoute.use(authenticationUserMiddleware)

/**
 * @description API để lấy danh sách các hashtag phổ biến hoặc liên quan đến một chủ đề cụ thể.
 * @method GET
 * @route /api/hashtags
 * @access Private
 */
hashtagsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(HashtagsController.getMulti))

export default hashtagsRoute
