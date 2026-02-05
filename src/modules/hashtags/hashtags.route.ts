import { Router } from 'express'
import HashtagsController from '~/modules/hashtags/hashtags.controller'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const hashtagsRoute = Router()

hashtagsRoute.use(verifyAccessToken)

hashtagsRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(HashtagsController.getMulti))

export default hashtagsRoute
