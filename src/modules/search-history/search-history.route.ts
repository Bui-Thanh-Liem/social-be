import { Router } from 'express'
import SearchHistoryController from '~/modules/search-history/search-history.controller'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/req/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { CreateSearchHistoryDtoSchema } from '~/modules/search-history/search-history.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const searchHistoryRoute = Router()

searchHistoryRoute.use(verifyAccessToken, verifyUserEmail)

searchHistoryRoute.post(
  '/',
  requestBodyValidate(CreateSearchHistoryDtoSchema),
  asyncHandler(SearchHistoryController.create)
)

searchHistoryRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(SearchHistoryController.getMulti))

searchHistoryRoute.delete('/:id', requestParamsValidate(ParamIdDtoSchema), asyncHandler(SearchHistoryController.delete))

export default searchHistoryRoute
