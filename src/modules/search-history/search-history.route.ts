import { Router } from 'express'
import SearchHistoryController from '~/modules/search-history/search-history.controller'
import { CreateSearchHistoryDtoSchema } from '~/modules/search-history/search-history.dto'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const searchHistoryRoute = Router()

searchHistoryRoute.use(authenticationMiddleware)

searchHistoryRoute.post('/', bodyValidate(CreateSearchHistoryDtoSchema), asyncHandler(SearchHistoryController.create))

searchHistoryRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(SearchHistoryController.getMulti))

searchHistoryRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(SearchHistoryController.delete))

export default searchHistoryRoute
