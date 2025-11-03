import { Router } from 'express'
import ReportTweetController from '~/controllers/ReportTweet.controller'
import { checkTweetByIdParams } from '~/middlewares/check-tweet-params.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const reportTweetRoute = Router()

reportTweetRoute.post(
  '/:tweet_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParams,
  wrapAsyncHandler(ReportTweetController.report)
)

export default reportTweetRoute
