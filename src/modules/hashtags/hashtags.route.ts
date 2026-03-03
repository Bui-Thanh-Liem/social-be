import { Router } from 'express'
import HashtagsController from '~/modules/hashtags/hashtags.controller'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const hashtagsRoute = Router()

hashtagsRoute.use(authenticationMiddleware)

hashtagsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(HashtagsController.getMulti))

export default hashtagsRoute
