import { Router } from 'express'
import searchController from '~/controllers/search.controller'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const searchRoute = Router()

// Các route dưới đây có thể có hoặc không có authentication
searchRoute.use(optionLogin(authenticationMiddleware))

// Tìm kiếm pending (gợi ý khi người dùng nhập từ khóa)
searchRoute.get('/pending', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchPending))

// Tìm kiếm tweet
searchRoute.get('/tweets', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchTweet))

// Tìm kiếm user
searchRoute.get('/users', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchUser))

// Tìm kiếm community
searchRoute.get('/communities', queryValidate(QueryDtoSchema), asyncHandler(searchController.searchCommunity))

export default searchRoute
