import { Router } from 'express'
import TweetsController from '~/controllers/Tweets.controller'
import { CreateTweetDtoSchema, GetOneTweetByIdDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { checkAudience } from '~/middlewares/checkAudience.middleware'
import { checkTweetParams } from '~/middlewares/checkTweetParams.middleware'
import { optionLogin } from '~/middlewares/optionLogin.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserActive } from '~/middlewares/verifyUserActive.middleware'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const tweetsRoute = Router()

tweetsRoute.post(
  '/',
  verifyAccessToken,
  verifyUserActive,
  requestBodyValidate(CreateTweetDtoSchema),
  wrapAsyncHandler(TweetsController.create)
)

tweetsRoute.get(
  '/:tweet_id',
  optionLogin(verifyAccessToken),
  requestParamsValidate(GetOneTweetByIdDtoSchema),
  checkTweetParams,
  checkAudience,
  wrapAsyncHandler(TweetsController.getOneById)
)

export default tweetsRoute
