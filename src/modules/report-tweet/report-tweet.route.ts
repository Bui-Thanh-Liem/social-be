import { Router } from 'express'
import ReportTweetController from '~/modules/report-tweet/report-tweet.controller'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { checkTweetByIdParamsMiddleware } from '~/middlewares/tweet/check-tweet-params.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const reportTweetRoute = Router()

reportTweetRoute.use(authenticationMiddleware)

reportTweetRoute.post(
  '/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParamsMiddleware,
  asyncHandler(ReportTweetController.report)
)

export default reportTweetRoute
