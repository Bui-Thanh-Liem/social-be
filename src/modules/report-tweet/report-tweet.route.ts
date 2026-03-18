import { Router } from 'express'
import ReportTweetController from '~/modules/report-tweet/report-tweet.controller'
import { paramIdTweetDtoSchema } from '~/modules/tweets/tweets.dto'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { checkTweetByIdParamsMiddleware } from '~/middlewares/tweet/check-tweet-params.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const reportTweetRoute = Router()

// Các route dưới đây cần authentication
reportTweetRoute.use(authenticationMiddleware)

// Báo cáo tweet
reportTweetRoute.post(
  '/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParamsMiddleware,
  asyncHandler(ReportTweetController.report)
)

export default reportTweetRoute
