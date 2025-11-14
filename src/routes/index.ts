import { NextFunction, Request, Response, Router } from 'express'
import { startFaker } from '~/utils/faker.util'
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
import uploadsRoute from './uploads.routes'
import usersRoute from './users.routes'

const rootRoute = Router()

rootRoute.use('/auth', authRoute)
rootRoute.use('/users', usersRoute)
rootRoute.use('/likes', likesRoute)
rootRoute.use('/tweets', tweetsRoute)
rootRoute.use('/follows', followsRoute)
rootRoute.use('/uploads', uploadsRoute)
rootRoute.use('/search', searchRoute)
rootRoute.use('/hashtags', hashtagsRoute)
rootRoute.use('/bookmarks', bookmarksRoute)
rootRoute.use('/report-tweet', reportTweetRoute)
rootRoute.use('/notifications', notificationRoute)
rootRoute.use('/trending', trendingRoute)
rootRoute.use('/messages', messagesRoute)
rootRoute.use('/conversations', conversationsRoute)
rootRoute.use('/communities', communitiesRoute)
rootRoute.use('/search-history', searchHistoryRoute)

rootRoute.post('/faker', async (req: Request, res: Response, next: NextFunction) => {
  await startFaker()
  res.status(200).json({
    message: 'Faker data success'
  })
})

// Health check
rootRoute.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

export default rootRoute
