import { Router } from 'express'
import tweetsController from '~/controllers/public/tweets.controller'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { adminChangeTweetStatusDtoSchema, adminRemindTweetDtoSchema } from '~/shared/dtos/private/tweet.dto'
import { checkTweetExistMiddleware } from '~/middlewares/public/tweet/check-tweet-exist.middleware'

const privateTweetsRoute = Router()

privateTweetsRoute.use(authenticationAdminMiddleware)

privateTweetsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(tweetsController.adminGetTweets))

privateTweetsRoute.patch(
  '/change-status/:id',
  paramsValidate(ParamIdDtoSchema),
  checkTweetExistMiddleware,
  bodyValidate(adminChangeTweetStatusDtoSchema),
  asyncHandler(tweetsController.adminChangeTweetStatus)
)

privateTweetsRoute.patch(
  '/remind/:id',
  paramsValidate(ParamIdDtoSchema),
  checkTweetExistMiddleware,
  bodyValidate(adminRemindTweetDtoSchema),
  asyncHandler(tweetsController.adminRemindTweet)
)

privateTweetsRoute.delete(
  '/:id',
  paramsValidate(ParamIdDtoSchema),
  checkTweetExistMiddleware,
  asyncHandler(tweetsController.adminDeleteTweet)
)

export default privateTweetsRoute
