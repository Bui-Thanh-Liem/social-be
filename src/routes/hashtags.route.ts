import { Router } from 'express'
import HashtagsController from '~/controllers/hashtags.controller'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const hashtagsRoute = Router()

// Các route dưới đây cần authentication
hashtagsRoute.use(authenticationMiddleware)

// Lấy danh sách hashtag
hashtagsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(HashtagsController.getMulti))

export default hashtagsRoute
