import { Router } from 'express'
import ReportTweetController from '~/controllers/ReportTweet.controller'
import { checkTweetByIdParams } from '~/middlewares/checkTweetParams.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { paramIdTweetDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

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
