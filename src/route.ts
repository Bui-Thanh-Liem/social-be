import { Request, Response, Router } from 'express'
import { OkResponse } from '~/core/success.response'
import { envs } from './configs/env.config'
import { checkApiKeyMiddleware } from './middlewares/check-api-key.middleware'
import accessRecentRoute from './modules/access-recent/access-recent.route'
import authRoute from './modules/auth/auth.routes'
import badWordsRoute from './modules/bad-words/bad-words.route'
import bookmarksRoute from './modules/bookmarks/bookmarks.route'
import communitiesRoute from './modules/communities/communities.route'
import conversationsRoute from './modules/conversations/conversations.route'
import followsRoute from './modules/follows/follows.route'
import hashtagsRoute from './modules/hashtags/hashtags.route'
import likesRoute from './modules/likes/likes.route'
import messagesRoute from './modules/messages/messages.route'
import notificationRoute from './modules/notifications/notifications.route'
import reportTweetRoute from './modules/report-tweet/report-tweet.route'
import searchHistoryRoute from './modules/search-history/search-history.route'
import searchRoute from './modules/search/search.route'
import trendingRoute from './modules/trending/trending.route'
import tweetsRoute from './modules/tweets/tweets.route'
import uploadsRoute from './modules/uploads/uploads.route'
import usersRoute from './modules/users/users.route'

const rootRoute = Router()

// Mount các route con
rootRoute.use('/auth', authRoute)

// API key middleware
rootRoute.use(checkApiKeyMiddleware)

//
rootRoute.use('/bookmarks', bookmarksRoute)
rootRoute.use('/communities', communitiesRoute)
rootRoute.use('/conversations', conversationsRoute)
rootRoute.use('/follows', followsRoute)
rootRoute.use('/hashtags', hashtagsRoute)
rootRoute.use('/likes', likesRoute)
rootRoute.use('/messages', messagesRoute)
rootRoute.use('/notifications', notificationRoute)
rootRoute.use('/access-recent', accessRecentRoute)
rootRoute.use('/report-tweet', reportTweetRoute)
rootRoute.use('/search', searchRoute)
rootRoute.use('/search-history', searchHistoryRoute)
rootRoute.use('/trending', trendingRoute)
rootRoute.use('/tweets', tweetsRoute)
rootRoute.use('/uploads', uploadsRoute)
rootRoute.use('/users', usersRoute)
rootRoute.use('/bad-words', badWordsRoute)

// Route tạo dữ liệu giả lập (mock data) cho việc phát triển và thử nghiệm
rootRoute.post('/mock-data', async (req: Request, res: Response) => {
  // await startMockData()
  // await startMockDataTweets()
  res.status(200).json(new OkResponse('✅ - Mock data created successfully'))
})

// Health check
rootRoute.get('/health', (req: Request, res: Response) => {
  res.status(200).json(new OkResponse(`✅ - ${envs.CLIENT_DOMAIN} is healthy!`))
})

export default rootRoute
