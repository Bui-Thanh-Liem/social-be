import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import database from '~/configs/database.config'
import { envs } from './configs/env.config'
import StreamVideoController from './controllers/StreamVideo.controller'
import { errorHandler } from './middlewares/errorhandler.middleware'
import { loggerMiddleware } from './middlewares/logger.middleware'
import authRoute from './routes/auth.routes'
import bookmarksRoute from './routes/bookmarks.routes'
import followsRoute from './routes/follows.routes'
import likesRoute from './routes/likes.routes'
import tweetsRoute from './routes/tweets.routes'
import uploadsRoute from './routes/uploads.routes'
import usersRoute from './routes/users.routes'
import bodyParser from 'body-parser'
import { UPLOAD_IMAGE_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from './shared/constants/path-static.constant'

const app = express()
const port = envs.SERVER_PORT
const host = envs.SERVER_HOST

app.use(cors())
app.use(morgan('dev'))
app.use(loggerMiddleware)

app.use((req, res, next) => {
  console.log("req.is('multipart/form-data'):::", req.is('multipart/form-data'))
  if (req.is('multipart/form-data')) {
    return next()
  }
  express.json({ limit: '10mb' })(req, res, next)
})
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })) // parse x-www-form-urlencoded

//
app.use('/auth', authRoute)
app.use('/users', usersRoute)
app.use('/likes', likesRoute)
app.use('/tweets', tweetsRoute)
app.use('/follows', followsRoute)
app.use('/uploads', uploadsRoute)
app.use('/bookmarks', bookmarksRoute)
app.use('/videos-streaming/:filename', StreamVideoController.streamVideo)
app.use('/videos-hls/:foldername/master.m3u8', StreamVideoController.streamMaster)
app.use('/videos-hls/:foldername/:v/:segment', StreamVideoController.streamSegment)
app.use(express.static(UPLOAD_IMAGE_FOLDER_PATH)) // Static file serving
app.use(express.static(UPLOAD_VIDEO_FOLDER_PATH)) // Static file serving

//
app.use(errorHandler)

//
async function bootstrap() {
  try {
    await database.connect()
    console.log('Database connected!')

    database.initialCollections()
    console.log('Cerated collections!')

    database.initialIndex()
    console.log('Cerated index!')

    app.listen(port, host, () => {
      console.log(`Example app listening on ${host}:${port}`)
    })
  } catch (err) {
    await database.disconnect()
    console.error('Failed to connect database:', err)
    process.exit(1) // dừng app nếu không connect được
  }
}

bootstrap()
