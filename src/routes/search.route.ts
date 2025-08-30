import { Router } from 'express'
import SearchController from '~/controllers/Search.controller'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const searchRoute = Router()

searchRoute.get(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(SearchController.searchTweet)
)

export default searchRoute
