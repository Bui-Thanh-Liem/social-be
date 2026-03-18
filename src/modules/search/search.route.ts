import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import SearchController from './search.controller'

const searchRoute = Router()

// Các route dưới đây có thể có hoặc không có authentication
searchRoute.use(optionLogin(authenticationMiddleware))

// Tìm kiếm pending (gợi ý khi người dùng nhập từ khóa)
searchRoute.get('/pending', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchPending))

// Tìm kiếm tweet
searchRoute.get('/tweets', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchTweet))

// Tìm kiếm user
searchRoute.get('/users', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchUser))

// Tìm kiếm community
searchRoute.get('/communities', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchCommunity))

export default searchRoute
