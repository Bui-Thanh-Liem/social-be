import { Router } from 'express'
import searchHistoryController from '~/controllers/search-history.controller'
import { CreateSearchHistoryDtoSchema } from '~/dtos/search-history.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const searchHistoryRoute = Router()

// Các route dưới đây cần authentication
searchHistoryRoute.use(authenticationMiddleware)

// Tạo mới search history
searchHistoryRoute.post('/', bodyValidate(CreateSearchHistoryDtoSchema), asyncHandler(searchHistoryController.create))

// Lấy danh sách search history
searchHistoryRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(searchHistoryController.getMulti))

// Xóa search history
searchHistoryRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(searchHistoryController.delete))

export default searchHistoryRoute
