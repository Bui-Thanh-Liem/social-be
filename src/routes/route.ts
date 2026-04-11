import { Request, Response, Router } from 'express'
import { OkResponse } from '~/core/success.response'
import { envs } from '../configs/env.config'
import { checkApiKeyMiddleware } from '../middlewares/check-api-key.middleware'
import accessRecentRoute from './public/access-recents.route'
import followsRoute from './public/follows.route'
import hashtagsRoute from './public/hashtags.route'
import likesRoute from './public/likes.route'
import notificationRoute from './public/notifications.route'
import reportTweetRoute from './public/report-tweets.route'
import searchHistoryRoute from './public/search-histories.route'
import tweetsRoute from './public/tweets.route'
import uploadsRoute from './public/uploads.route'
import usersRoute from './public/users.route'
import { startMockData } from '../utils/mock-data.util'
import authRoute from './public/auth-user.route'
import bookmarksRoute from './public/bookmarks.route'
import conversationsRoute from './public/conversations.route'
import communitiesRoute from './public/communities.route'
import messagesRoute from './public/messages.route'
import searchRoute from './public/search.route'
import trendingRoute from './public/trending.route'
import badWordsRoute from './public/bad-words.route'
import reelRoute from './public/reels.routes'
import authAdminRoute from './private/auth-admin.route'

const rootRoute = Router()

// Mount các route con
rootRoute.use('/auth', authRoute)

// API key middleware
rootRoute.use(checkApiKeyMiddleware)

// PUBLIC ROUTES
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
rootRoute.use('/reels', reelRoute)

// PRIVATE ROUTES
rootRoute.use('/admin', authAdminRoute)

// Route tạo dữ liệu giả lập (mock data) cho việc phát triển và thử nghiệm
rootRoute.post('/mock-data', async (req: Request, res: Response) => {
  await startMockData()
  res.status(200).json(new OkResponse('✅ - Mock data created successfully'))
})

// Health check
rootRoute.get('/health', (req: Request, res: Response) => {
  res.status(200).json(new OkResponse(`✅ - ${envs.CLIENT_DOMAIN} is healthy!`))
})

export default rootRoute
