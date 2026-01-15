import { Request, Response, Router } from 'express'
import { startMockData } from '~/utils/mock-data.util'
import authRoute from './auth.routes'
import bookmarksRoute from './bookmarks.routes'
import communitiesRoute from './communities.routes'
import conversationsRoute from './conversations.routes'
import followsRoute from './follows.routes'
import hashtagsRoute from './hashtags.routes'
import likesRoute from './likes.routes'
import messagesRoute from './messages.routes'
import notificationRoute from './notification.route'
import reportTweetRoute from './report-tweet.routes'
import searchHistoryRoute from './search-history.routes'
import searchRoute from './search.route'
import trendingRoute from './trending.routes'
import tweetsRoute from './tweets.routes'
import usersRoute from './users.routes'
import uploadsRoute from './upload.route'
import { OkResponse } from '~/core/success.response'

const rootRoute = Router()

rootRoute.use('/auth', authRoute)
rootRoute.use('/users', usersRoute)
rootRoute.use('/likes', likesRoute)
rootRoute.use('/tweets', tweetsRoute)
rootRoute.use('/follows', followsRoute)
rootRoute.use('/search', searchRoute)
rootRoute.use('/uploads', uploadsRoute)
rootRoute.use('/hashtags', hashtagsRoute)
rootRoute.use('/bookmarks', bookmarksRoute)
rootRoute.use('/report-tweet', reportTweetRoute)
rootRoute.use('/notifications', notificationRoute)
rootRoute.use('/trending', trendingRoute)
rootRoute.use('/messages', messagesRoute)
rootRoute.use('/conversations', conversationsRoute)
rootRoute.use('/communities', communitiesRoute)
rootRoute.use('/search-history', searchHistoryRoute)

// Route tạo dữ liệu giả lập (mock data) cho việc phát triển và thử nghiệm
rootRoute.post('/mock-data', async (req: Request, res: Response) => {
  await startMockData()
  res.status(200).json(new OkResponse('✅ - Mock data created successfully'))
})

// Health check
rootRoute.get('/health', (req: Request, res: Response) => {
  res.status(200).json(new OkResponse('✅ - devandbug.info.vn is healthy!'))
})

export default rootRoute
