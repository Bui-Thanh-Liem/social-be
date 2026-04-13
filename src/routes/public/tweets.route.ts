import { Router } from 'express'
import tweetsController from '~/controllers/public/tweets.controller'
import {
  createTweetDtoSchema,
  getNewFeedTypeDtoSchema,
  getProfileTweetDtoSchema,
  getTweetChildrenDtoSchemaParams
} from '~/shared/dtos/public/tweets.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { optionLogin } from '~/middlewares/common/option-login.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { checkAudienceMiddleware } from '~/middlewares/public/tweet/check-audience.middleware'
import { checkTweetExistMiddleware } from '~/middlewares/public/tweet/check-tweet-exist.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module TweetsRoutes
 * @description Quản lý các API liên quan đến chức năng tweet, bao gồm tạo mới, xóa, lấy new feeds, lấy bài viết trong cộng đồng, lấy bài viết của profile, lấy bài viết đã like/bookmark, lấy danh sách bài viết con của một bài viết và thống kê view/like/bookmark trong tuần.
 */

const tweetsRoute = Router()

/**
 * @description API để tạo một tweet mới. Người dùng có thể cung cấp nội dung, loại tweet, đối tượng khán giả và các thông tin liên quan khác để tạo ra một bài viết mới trên nền tảng.
 * @method POST
 * @route /api/tweets
 * @access Private (chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này)
 */
tweetsRoute.post(
  '/',
  authenticationUserMiddleware,
  bodyValidate(createTweetDtoSchema),
  asyncHandler(tweetsController.create)
)

/**
 * @description API để xóa một tweet. Người dùng có thể xóa tweet của mình nếu họ là người tạo ra tweet đó.
 * @method DELETE
 * @route /api/tweets/:id
 * @access Private (chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này)
 */
tweetsRoute.delete(
  '/:id',
  authenticationUserMiddleware,
  paramsValidate(ParamIdDtoSchema),
  asyncHandler(tweetsController.delete)
)

/**
 * @description All = 'all', // New feeds tổng (everyone + following)
 * @description Everyone = 'everyone', // Chỉ người mình everyone
 * @description Following = 'following' // Chỉ người mình follow
 * @method GET
 * @route /api/tweets/feeds/:feed_type
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
tweetsRoute.get(
  '/feeds/:feed_type',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  paramsValidate(getNewFeedTypeDtoSchema),
  asyncHandler(tweetsController.getNewFeeds)
)

/**
 * @description API để lấy danh sách các bài viết đang chờ duyệt trong một cộng đồng cụ thể. Chỉ những người dùng đã đăng nhập và có quyền quản lý cộng đồng mới có thể truy cập vào API này.
 * @method GET
 * @route /api/tweets/community/pending
 * @access Private (chỉ những người dùng đã đăng nhập và có quyền quản lý cộng đồng mới có thể truy cập)
 */
tweetsRoute.get(
  '/community/pending',
  authenticationUserMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(tweetsController.getTweetsPendingByCommunityId)
)

/**
 * @description API để lấy danh sách các bài viết trong một cộng đồng cụ thể. Người dùng có thể truy cập vào API này nếu họ đã đăng nhập và là thành viên của cộng đồng đó.
 * @method GET
 * @route /api/tweets/community
 * @access Private (chỉ những người dùng đã đăng nhập và là thành viên của cộng đồng mới có thể truy cập)
 */
tweetsRoute.get(
  '/community',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(tweetsController.getCommunityTweets)
)

/**
 * @description API để lấy danh sách các bài viết của một người dùng cụ thể. Người dùng có thể truy cập vào API này nếu họ đã đăng nhập và là chủ sở hữu của profile đó hoặc profile đó là công khai.
 * @method GET
 * @route /api/tweets/profile/:tweet_type
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
tweetsRoute.get(
  '/profile/:tweet_type',
  optionLogin(authenticationUserMiddleware),
  paramsValidate(getProfileTweetDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(tweetsController.getProfileTweets)
)

/**
 * @description API để lấy danh sách các bài viết mà người dùng đã like.
 * @method GET
 * @route /api/tweets/liked
 * @access Private (chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này)
 */
tweetsRoute.get(
  '/liked',
  authenticationUserMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(tweetsController.getTweetLiked)
)

/**
 * @description API để lấy danh sách các bài viết mà người dùng đã bookmark.
 * @method GET
 * @route /api/tweets/bookmarked
 * @access Private (chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này)
 */
tweetsRoute.get(
  '/bookmarked',
  authenticationUserMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(tweetsController.getTweetBookmarked)
)

/**
 * @description API để lấy danh sách bài viết con (reply, quote) của một bài viết.
 * @method GET
 * @route /api/tweets/:id/:tweet_type/children
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
tweetsRoute.get(
  '/:id/:tweet_type/children',
  optionLogin(authenticationUserMiddleware),
  paramsValidate(getTweetChildrenDtoSchemaParams),
  queryValidate(QueryDtoSchema),
  checkTweetExistMiddleware, // chỉ  kiểm tra tồn tại và lấy audience cho checkAudience
  checkAudienceMiddleware,
  asyncHandler(tweetsController.getTweetChildren)
)

/**
 * @description API để thống kê lượt xem, thích, lưu trong tuần.
 * @method GET
 * @route /api/tweets/view-like-bookmark
 * @access Private (chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này)
 */
tweetsRoute.get(
  '/view-like-bookmark',
  optionLogin(authenticationUserMiddleware),
  asyncHandler(tweetsController.countViewLinkBookmarkInWeek)
)

/**
 * @description API để lấy một bài viết theo id (dùng cho cả new feed, profile, community).
 * @method GET
 * @route /api/tweets/:id
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
tweetsRoute.get(
  '/:id',
  optionLogin(authenticationUserMiddleware),
  paramsValidate(ParamIdDtoSchema),
  checkTweetExistMiddleware,
  checkAudienceMiddleware,
  asyncHandler(tweetsController.getOneById)
)

export default tweetsRoute
