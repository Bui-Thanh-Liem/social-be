import { Router } from 'express'
import tweetsController from '~/controllers/public/tweets.controller'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const privateTweetsRoute = Router()

privateTweetsRoute.use(authenticationAdminMiddleware)

privateTweetsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(tweetsController.getTweets))

export default privateTweetsRoute
