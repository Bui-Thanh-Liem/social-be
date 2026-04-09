import { Request, Response, Router } from 'express'
import { OkResponse } from '~/core/success.response'
import { envs } from '../configs/env.config'
import { checkApiKeyMiddleware } from '../middlewares/check-api-key.middleware'
import accessRecentRoute from './access-recents.route'
import followsRoute from './follows.route'
import hashtagsRoute from './hashtags.route'
import likesRoute from './likes.route'
import notificationRoute from './notifications.route'
import reportTweetRoute from './report-tweets.route'
import searchHistoryRoute from './search-histories.route'
import tweetsRoute from './tweets.route'
import uploadsRoute from './uploads.route'
import usersRoute from './users.route'
import { startMockData } from '../utils/mock-data.util'
import authRoute from './auth.route'
import bookmarksRoute from './bookmarks.route'
import conversationsRoute from './conversations.route'
import communitiesRoute from './communities.route'
import messagesRoute from './messages.route'
import searchRoute from './search.route'
import trendingRoute from './trending.route'
import badWordsRoute from './bad-words.route'
import reelRoute from './reels.routes'

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
rootRoute.use('/reels', reelRoute)

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
