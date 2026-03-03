import { Router } from 'express'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import SearchController from './search.controller'

const searchRoute = Router()

searchRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

searchRoute.get('/pending', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchPending))

searchRoute.get('/tweets', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchTweet))

searchRoute.get('/users', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchUser))

export default searchRoute
