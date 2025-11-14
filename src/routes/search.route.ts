import { Router } from 'express'
import SearchController from '~/controllers/Search.controller'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const searchRoute = Router()

searchRoute.get(
  '/pending',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(SearchController.searchPending)
)

searchRoute.get(
  '/tweets',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(SearchController.searchTweet)
)

searchRoute.get(
  '/users',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(SearchController.searchUser)
)

export default searchRoute
