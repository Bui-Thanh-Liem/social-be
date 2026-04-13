import { Router } from 'express'
import searchHistoryController from '~/controllers/public/search-histories.controller'
import { CreateSearchHistoryDtoSchema } from '~/dtos/public/search-history.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { optionLogin } from '~/middlewares/common/option-login.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module SearchHistoriesRoutes
 * @description Quản lý danh sách lịch sử tìm kiếm của người dùng, bao gồm tạo mới, lấy danh sách và xóa lịch sử tìm kiếm.
 */

const searchHistoriesRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, cho phép truy cập nếu người dùng đã đăng nhập hoặc không đăng nhập (tùy chọn).
 */
searchHistoriesRoute.use(optionLogin(authenticationUserMiddleware))

/**
 * @description API để tạo một mục lịch sử tìm kiếm mới cho người dùng. Người dùng có thể cung cấp từ khóa tìm kiếm và các thông tin liên quan khác.
 * @method POST
 * @route /api/search-histories
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
searchHistoriesRoute.post('/', bodyValidate(CreateSearchHistoryDtoSchema), asyncHandler(searchHistoryController.create))

/**
 * @description API để lấy danh sách các mục lịch sử tìm kiếm của người dùng, có hỗ trợ phân trang. Nếu người dùng đã đăng nhập, nó sẽ trả về lịch sử tìm kiếm của người dùng đó.
 * @method GET
 * @route /api/search-histories
 * @access Private (trả về lịch sử tìm kiếm nếu người dùng đã đăng nhập)
 */
searchHistoriesRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(searchHistoryController.getMulti))

/**
 * @description API để xóa một mục lịch sử tìm kiếm cụ thể của người dùng dựa trên ID của nó. Chỉ chủ sở hữu của mục lịch sử tìm kiếm mới có thể thực hiện hành động này.
 * @method DELETE
 * @route /api/search-histories/:id
 * @access Private
 */
searchHistoriesRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(searchHistoryController.delete))

export default searchHistoriesRoute
