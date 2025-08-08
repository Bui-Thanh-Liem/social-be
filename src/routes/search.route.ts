import { Router } from 'express'
import SearchController from '~/controllers/Search.controller'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserActive } from '~/middlewares/verifyUserActive.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const searchRoute = Router()

searchRoute.get(
  '/',
  verifyAccessToken,
  verifyUserActive,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(SearchController.searchTweet)
)

export default searchRoute
