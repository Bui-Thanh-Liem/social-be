import { Router } from 'express'
import TweetsController from '~/controllers/Tweets.controller'
import { checkAudience } from '~/middlewares/checkAudience.middleware'
import { checkTweetByIdParams } from '~/middlewares/checkTweetParams.middleware'
import { checkTweetParamsId } from '~/middlewares/checkTweetParamsId.middleware'
import { optionLogin } from '~/middlewares/optionLogin.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import {
  CreateTweetDtoSchema,
  getNewFeedTypeDtoSchema,
  GetOneTweetByIdDtoSchema,
  getProfileTweetDtoSchema,
  getTweetChildrenDtoSchemaParams,
  paramIdTweetDtoSchema
} from '~/shared/dtos/req/tweet.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const tweetsRoute = Router()

tweetsRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateTweetDtoSchema),
  wrapAsyncHandler(TweetsController.create)
)

tweetsRoute.delete(
  '/:tweet_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(paramIdTweetDtoSchema),
  wrapAsyncHandler(TweetsController.delete)
)

/*
All = 'all', // New feeds tổng (everyone + following)
Everyone = 'everyone', // Chỉ người mình everyone
Following = 'following' // Chỉ người mình follow
 */
tweetsRoute.get(
  '/feeds/:feed_type',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(getNewFeedTypeDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TweetsController.getNewFeeds)
)

tweetsRoute.get(
  '/profile/:tweet_type',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(getProfileTweetDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TweetsController.getProfileTweets)
)

tweetsRoute.get(
  '/liked',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TweetsController.getTweetLiked)
)

tweetsRoute.get(
  '/bookmarked',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TweetsController.getTweetBookmarked)
)

tweetsRoute.get(
  '/:tweet_id/:tweet_type/children',
  optionLogin(verifyAccessToken),
  optionLogin(verifyUserEmail),
  requestParamsValidate(getTweetChildrenDtoSchemaParams),
  requestQueryValidate(QueryDtoSchema),
  checkTweetParamsId, // chỉ  kiểm tra tồn tại và lấy audience cho checkAudience
  checkAudience,
  wrapAsyncHandler(TweetsController.getTweetChildren)
)

tweetsRoute.get(
  '/:tweet_id',
  optionLogin(verifyAccessToken),
  optionLogin(verifyUserEmail),
  requestParamsValidate(GetOneTweetByIdDtoSchema),
  checkTweetByIdParams,
  checkAudience,
  wrapAsyncHandler(TweetsController.getOneById)
)

export default tweetsRoute
