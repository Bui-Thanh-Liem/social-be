import { Router } from 'express'
import TweetsController from '~/controllers/Tweets.controller'
import { checkAudience } from '~/middlewares/checkAudience.middleware'
import { checkTweetParams } from '~/middlewares/checkTweetParams.middleware'
import { checkTweetParamsId } from '~/middlewares/checkTweetParamsId.middleware'
import { optionLogin } from '~/middlewares/optionLogin.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserActive } from '~/middlewares/verifyUserActive.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import {
  CreateTweetDtoSchema,
  getNewFeedTypeDtoSchema,
  GetOneTweetByIdDtoSchema,
  getTweetChildrenDtoSchemaBody,
  getTweetChildrenDtoSchemaParams
} from '~/shared/dtos/req/tweet.dto'
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
  '/feeds/:feed_type',
  verifyAccessToken,
  verifyUserActive,
  requestParamsValidate(getNewFeedTypeDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TweetsController.getNewFeeds)
)

tweetsRoute.get(
  '/:tweet_id/children',
  optionLogin(verifyAccessToken),
  optionLogin(verifyUserActive),
  requestParamsValidate(getTweetChildrenDtoSchemaParams),
  requestBodyValidate(getTweetChildrenDtoSchemaBody),
  requestQueryValidate(QueryDtoSchema),
  checkTweetParamsId, // chỉ  kiểm tra tồn tại và lấy audience cho checkAudience
  checkAudience,
  wrapAsyncHandler(TweetsController.getTweetChildren)
)

tweetsRoute.get(
  '/:tweet_id',
  optionLogin(verifyAccessToken),
  optionLogin(verifyUserActive),
  requestParamsValidate(GetOneTweetByIdDtoSchema),
  checkTweetParams,
  checkAudience,
  wrapAsyncHandler(TweetsController.getOneById)
)

export default tweetsRoute
