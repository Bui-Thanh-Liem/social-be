import { Router } from 'express'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import SearchController from './search.controller'

const searchRoute = Router()

searchRoute.use(verifyAccessToken, verifyUserEmail)

searchRoute.get('/pending', requestQueryValidate(QueryDtoSchema), asyncHandler(SearchController.searchPending))

searchRoute.get('/tweets', requestQueryValidate(QueryDtoSchema), asyncHandler(SearchController.searchTweet))

searchRoute.get('/users', requestQueryValidate(QueryDtoSchema), asyncHandler(SearchController.searchUser))

export default searchRoute
