import { Router } from 'express'
import searchHistoryController from '~/controllers/search-histories.controller'
import { CreateSearchHistoryDtoSchema } from '~/dtos/search-history.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const searchHistoriesRoute = Router()

// Các route dưới đây cần authentication
searchHistoriesRoute.use(optionLogin(authenticationMiddleware))

// Tạo mới search history
searchHistoriesRoute.post('/', bodyValidate(CreateSearchHistoryDtoSchema), asyncHandler(searchHistoryController.create))

// Lấy danh sách search history
searchHistoriesRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(searchHistoryController.getMulti))

// Xóa search history
searchHistoriesRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(searchHistoryController.delete))

export default searchHistoriesRoute
