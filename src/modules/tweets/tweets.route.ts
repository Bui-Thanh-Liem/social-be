import { Router } from 'express'
import TweetsController from '~/modules/tweets/tweets.controller'
import {
  createTweetDtoSchema,
  getNewFeedTypeDtoSchema,
  getOneTweetByIdDtoSchema,
  getProfileTweetDtoSchema,
  getTweetChildrenDtoSchemaParams,
  paramIdTweetDtoSchema
} from '~/modules/tweets/tweets.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { optionLogin } from '~/utils/option-login.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { checkAudienceMiddleware } from '~/shared/middlewares/tweet/check-audience.middleware'
import { checkTweetExistMiddleware } from '~/shared/middlewares/tweet/check-tweet-exist.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const tweetsRoute = Router()

tweetsRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

tweetsRoute.post(
  '/',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  bodyValidate(createTweetDtoSchema),
  asyncHandler(TweetsController.create)
)

tweetsRoute.delete(
  '/:tweet_id',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  paramsValidate(paramIdTweetDtoSchema),
  asyncHandler(TweetsController.delete)
)

/*
All = 'all', // New feeds tổng (everyone + following)
Everyone = 'everyone', // Chỉ người mình everyone
Following = 'following' // Chỉ người mình follow
 */
tweetsRoute.get(
  '/feeds/:feed_type',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  paramsValidate(getNewFeedTypeDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getNewFeeds)
)

// Lấy bài viết đang chờ duyệt trong cộng đồng
tweetsRoute.get(
  '/community/pending',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getTweetsPendingByCommunityId)
)

// Lấy bài viết trong cộng đồng (feeds)
tweetsRoute.get(
  '/community',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getCommunityTweets)
)

tweetsRoute.get(
  '/profile/:tweet_type',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  paramsValidate(getProfileTweetDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getProfileTweets)
)

tweetsRoute.get(
  '/liked',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getTweetLiked)
)

tweetsRoute.get(
  '/bookmarked',
  authenticationMiddleware,
  verifyUserEmailMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(TweetsController.getTweetBookmarked)
)

tweetsRoute.get(
  '/:tweet_id/:tweet_type/children',
  optionLogin(authenticationMiddleware),
  optionLogin(verifyUserEmailMiddleware),
  paramsValidate(getTweetChildrenDtoSchemaParams),
  queryValidate(QueryDtoSchema),
  checkTweetExistMiddleware, // chỉ  kiểm tra tồn tại và lấy audience cho checkAudience
  checkAudienceMiddleware,
  asyncHandler(TweetsController.getTweetChildren)
)

tweetsRoute.get('/view-like-bookmark', asyncHandler(TweetsController.countViewLinkBookmarkInWeek))

tweetsRoute.get(
  '/:tweet_id',
  optionLogin(authenticationMiddleware),
  optionLogin(verifyUserEmailMiddleware),
  paramsValidate(getOneTweetByIdDtoSchema),
  checkTweetExistMiddleware,
  checkAudienceMiddleware,
  asyncHandler(TweetsController.getOneById)
)

export default tweetsRoute
