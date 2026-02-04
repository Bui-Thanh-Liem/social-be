import { Router } from 'express'
import HashtagsController from '~/controllers/Hashtags.controller'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/user/verify-access-token.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const hashtagsRoute = Router()

hashtagsRoute.use(verifyAccessToken)

hashtagsRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(HashtagsController.getMulti))

export default hashtagsRoute
