import { Router } from 'express'
import TweetsController from '~/controllers/Tweets.controller'
import { checkAudience } from '~/middlewares/check-audience.middleware'
import { checkTweetParamsId } from '~/middlewares/check-tweet-params-id.middleware'
import { checkTweetByIdParams } from '~/middlewares/check-tweet-params.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import {
  CreateTweetDtoSchema,
  getNewFeedTypeDtoSchema,
  GetOneTweetByIdDtoSchema,
  getProfileTweetDtoSchema,
  getTweetChildrenDtoSchemaParams,
  paramIdTweetDtoSchema
} from '~/shared/dtos/req/tweet.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const tweetsRoute = Router()

tweetsRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateTweetDtoSchema),
  asyncHandler(TweetsController.create)
)

tweetsRoute.delete(
  '/:tweet_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(paramIdTweetDtoSchema),
  asyncHandler(TweetsController.delete)
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
  asyncHandler(TweetsController.getNewFeeds)
)

// Lấy bài viết đang chờ duyệt trong cộng đồng
tweetsRoute.get(
  '/community/pending',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getTweetsPendingByCommunityId)
)

// Lấy bài viết trong cộng đồng (feeds)
tweetsRoute.get(
  '/community',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getCommunityTweets)
)

tweetsRoute.get(
  '/profile/:tweet_type',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(getProfileTweetDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getProfileTweets)
)

tweetsRoute.get(
  '/liked',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getTweetLiked)
)

tweetsRoute.get(
  '/bookmarked',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getTweetBookmarked)
)

tweetsRoute.get(
  '/:tweet_id/:tweet_type/children',
  optionLogin(verifyAccessToken),
  optionLogin(verifyUserEmail),
  requestParamsValidate(getTweetChildrenDtoSchemaParams),
  requestQueryValidate(QueryDtoSchema),
  checkTweetParamsId, // chỉ  kiểm tra tồn tại và lấy audience cho checkAudience
  checkAudience,
  asyncHandler(TweetsController.getTweetChildren)
)

tweetsRoute.get(
  '/:tweet_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(GetOneTweetByIdDtoSchema),
  checkTweetByIdParams,
  checkAudience,
  asyncHandler(TweetsController.getOneById)
)

export default tweetsRoute
