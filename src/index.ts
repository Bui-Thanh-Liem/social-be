import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Request, Response } from 'express'
import { createServer } from 'http'
import morgan from 'morgan'
import { Server } from 'socket.io'
import database from '~/configs/database.config'
import { envs } from './configs/env.config'
import StreamVideoController from './controllers/StreamVideo.controller'
import { errorHandler } from './middlewares/errorhandler.middleware'
import { loggerMiddleware } from './middlewares/logger.middleware'
import authRoute from './routes/auth.routes'
import bookmarksRoute from './routes/bookmarks.routes'
import followsRoute from './routes/follows.routes'
import likesRoute from './routes/likes.routes'
import searchRoute from './routes/search.route'
import tweetsRoute from './routes/tweets.routes'
import uploadsRoute from './routes/uploads.routes'
import usersRoute from './routes/users.routes'
import { UPLOAD_IMAGE_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from './shared/constants/path-static.constant'
import { startFaker } from './utils/faker.util'
import { logger } from './utils/logger.util'
import conversationsRoute from './routes/conversations.routes'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

//
const port = envs.SERVER_PORT
const host = envs.SERVER_HOST

app.use(cors())
app.use(morgan('dev'))
app.use(loggerMiddleware)

// Linh động giữa form-data hoặc application/json
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    logger.info("req.is('multipart/form-data'):::", req.is('multipart/form-data'))
    return next()
  }
  express.json({ limit: '10mb' })(req, res, next)
})
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })) // parse x-www-form-urlencoded

//
app.post('/faker', async (req: Request, res: Response) => {
  await startFaker()
  res.status(200).json({
    message: 'Faker data success'
  })
})
app.use('/auth', authRoute)
app.use('/users', usersRoute)
app.use('/likes', likesRoute)
app.use('/tweets', tweetsRoute)
app.use('/follows', followsRoute)
app.use('/uploads', uploadsRoute)
app.use('/search', searchRoute)
app.use('/bookmarks', bookmarksRoute)
app.use('/conversations', conversationsRoute)
app.use('/videos-streaming/:filename', StreamVideoController.streamVideo)
app.use('/videos-hls/:foldername/master.m3u8', StreamVideoController.streamMaster)
app.use('/videos-hls/:foldername/:v/:segment', StreamVideoController.streamSegment)
app.use(express.static(UPLOAD_IMAGE_FOLDER_PATH)) // Static file serving
app.use(express.static(UPLOAD_VIDEO_FOLDER_PATH)) // Static file serving

//
app.use(errorHandler)

// Socket
io.on('connection', (socket) => {
  logger.info(`User ${socket.id} connected`)
  socket.emit('getting', `Message to server 'Hi ${socket.id}'`)

  socket.on('disconnect', (reason) => {
    logger.info(`User ${socket.id} disconnected. Reason: ${reason}`)
  })
})

//
async function bootstrap() {
  try {
    await database.connect()
    logger.info('Database connected!')

    database.initialCollections()
    logger.info('Cerated collections!')

    database.initialIndex()
    logger.info('Cerated index!')

    httpServer.listen(port, host, () => {
      logger.info(`App listening on ${host}:${port}`)
    })
  } catch (err) {
    await database.disconnect()
    logger.error('Failed to connect database:', err)
    process.exit(1) // dừng app nếu không connect được
  }
}

bootstrap()
