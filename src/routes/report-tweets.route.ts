import { Router } from 'express'
import reportTweetController from '~/controllers/report-tweets.controller'
import { paramIdTweetDtoSchema } from '~/dtos/tweets.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { checkTweetByIdParamsMiddleware } from '~/middlewares/tweet/check-tweet-params.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const reportTweetRoute = Router()

// Các route dưới đây cần authentication
reportTweetRoute.use(authenticationMiddleware)

// Báo cáo tweet
reportTweetRoute.post(
  '/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParamsMiddleware,
  asyncHandler(reportTweetController.report)
)

export default reportTweetRoute
