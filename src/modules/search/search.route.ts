import { Router } from 'express'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { queryValidate } from '~/utils/query-validate.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import SearchController from './search.controller'

const searchRoute = Router()

searchRoute.get('/pending', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchPending))

searchRoute.get('/tweets', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchTweet))

searchRoute.get('/users', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchUser))

searchRoute.get('/communities', queryValidate(QueryDtoSchema), asyncHandler(SearchController.searchCommunity))

export default searchRoute
