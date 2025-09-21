import { NextFunction, Request, Response, Router } from 'express'
import StreamVideoController from '~/controllers/StreamVideo.controller'
import { startFaker } from '~/utils/faker.util'
import authRoute from './auth.routes'
import bookmarksRoute from './bookmarks.routes'
import conversationsRoute from './conversations.routes'
import exploreRoute from './explore.routes'
import followsRoute from './follows.routes'
import likesRoute from './likes.routes'
import messagesRoute from './messages.routes'
import searchRoute from './search.route'
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
rootRoute.use('/explore', exploreRoute)
rootRoute.use('/bookmarks', bookmarksRoute)
rootRoute.use('/conversations', conversationsRoute)
rootRoute.use('/messages', messagesRoute)
rootRoute.get('/videos-streaming/:filename', StreamVideoController.streamVideo)
rootRoute.get('/videos-hls/:foldername/master.m3u8', StreamVideoController.streamMaster)
rootRoute.get('/videos-hls/:foldername/:v/:segment', StreamVideoController.streamSegment)

rootRoute.post('/faker', async (req: Request, res: Response, next: NextFunction) => {
  await startFaker()
  res.status(200).json({
    message: 'Faker data success'
  })
})

export default rootRoute
