import { Router } from 'express'
import ReportTweetController from '~/controllers/ReportTweet.controller'
import { checkTweetByIdParams } from '~/middlewares/tweet/check-tweet-params.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/user/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const reportTweetRoute = Router()

reportTweetRoute.use(verifyAccessToken, verifyUserEmail)

reportTweetRoute.post(
  '/:tweet_id',
  requestParamsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParams,
  asyncHandler(ReportTweetController.report)
)

export default reportTweetRoute
