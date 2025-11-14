import { Router } from 'express'
import SearchHistoryController from '~/controllers/SearchHistory.controller'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/req/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { CreateSearchHistoryDtoSchema } from '~/shared/dtos/req/search-history.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const searchHistoryRoute = Router()

searchHistoryRoute.post(
  '/',
  verifyAccessToken,
  requestBodyValidate(CreateSearchHistoryDtoSchema),
  asyncHandler(SearchHistoryController.create)
)

searchHistoryRoute.get(
  '/',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(SearchHistoryController.getMulti)
)

searchHistoryRoute.delete(
  '/:id',
  verifyAccessToken,
  requestParamsValidate(ParamIdDtoSchema),
  asyncHandler(SearchHistoryController.delete)
)

export default searchHistoryRoute
