import { Router } from 'express'
import searchController from '~/controllers/public/search.controller'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module SearchRoutes
 * @description Quản lý các API liên quan đến chức năng tìm kiếm, bao gồm tìm kiếm pending (gợi ý khi người dùng nhập từ khóa), tìm kiếm tweet, tìm kiếm user và tìm kiếm community.
 */

const searchRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, cho phép truy cập nếu người dùng đã đăng nhập hoặc không đăng nhập (tùy chọn).
 */
searchRoute.use(optionLogin(authenticationUserMiddleware))

/**
 * @description API để tìm kiếm pending (gợi ý khi người dùng nhập từ khóa). Kết quả trả về có thể bao gồm các tweet, user hoặc community phù hợp với từ khóa tìm kiếm.
 * @method GET
 * @route /api/search/pending
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
searchRoute.get('/pending', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchPending))

/**
 * @description API để tìm kiếm các tweet phù hợp với từ khóa tìm kiếm. Kết quả trả về có thể bao gồm các tweet có chứa từ khóa trong nội dung, hashtag hoặc tên người dùng.
 * @method GET
 * @route /api/search/tweets
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
searchRoute.get('/tweets', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchTweet))

/**
 * @description API để tìm kiếm các user phù hợp với từ khóa tìm kiếm. Kết quả trả về có thể bao gồm các user có tên hoặc tên người dùng chứa từ khóa tìm kiếm.
 * @method GET
 * @route /api/search/users
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
searchRoute.get('/users', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchUser))

/**
 * @description API để tìm kiếm các community phù hợp với từ khóa tìm kiếm. Kết quả trả về có thể bao gồm các community có tên hoặc mô tả chứa từ khóa tìm kiếm.
 * @method GET
 * @route /api/search/communities
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
searchRoute.get('/communities', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchCommunity))

export default searchRoute
