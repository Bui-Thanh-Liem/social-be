import compression from 'compression'
import express, { Response } from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import swaggerUi from 'swagger-ui-express'

//
import morgan from 'morgan'
import { envs } from './configs/env.config'
import { swaggerSpec } from './configs/swagger.config'
// import StreamVideoController from './controllers/StreamVideo.controller'
import { corsMiddleware } from './middlewares/cors.middleware'
import { errorHandler } from './middlewares/errorhandler.middleware'
import { loggerMiddleware } from './middlewares/logger.middleware'
import { globalRateLimit } from './middlewares/ratelimit.middleware'
import rootRoute from './routes'
import { logger } from './utils/logger.util'

//
// import { UPLOAD_IMAGE_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from './shared/constants'
import './tasks/cleanup.task'
import './tasks/sync.task'
const isDev = process.env.NODE_ENV === 'development'

const app = express()

// Tin tưởng 1 proxy (nginx/traefik)
app.set('trust proxy', 1)

// CORS
app.use(corsMiddleware) // Kiểm tra origin, chờ response (gắn vào headers)

// Cookie
// app.use(session({
//   secret: "keyboard cat",
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }  // chỉ gửi cookie qua HTTPS
// }))

// Security middleware (set nhiều headers bảo mật cho res, trước khi gửi về client)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:']
      }
    }
  })
)

// Nén response body bằng thuật toán gzip/deflate trước khi gửi trả.
app.use(compression())
app.use(hpp()) // page=1&page=4 => thì lấy page=4

//
app.use(morgan(isDev ? 'dev' : 'combined'))
app.use(loggerMiddleware)

// Rate limiting
app.use(globalRateLimit)

// Body parsing
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    logger.info("req.is('multipart/form-data'):::", req.is('multipart/form-data'))
    return next()
  }
  express.json({ limit: '10mb' })(req, res, next) // application/json
})
app.use(express.urlencoded({ extended: true, limit: '50mb' })) // application/x-www-form-urlencoded

// Static media (images + videos)
const staticOptions = {
  setHeaders: (res: Response) => {
    // Thêm CORS headers cho static files
    // Chỉ cho phép domain của bạn load ảnh (ngăn hotlink thô)
    res.set('Access-Control-Allow-Origin', envs.CLIENT_DOMAIN) // domain có thể gửi request đến server này và nhận được response.  (fetch)
    res.set('Cross-Origin-Resource-Policy', 'cross-origin') // cho phép tài nguyên (vd: ảnh, video, file…) được nhúng hoặc load từ bất kỳ origin nào. (<img src="" />)
  }
}

// Static media
// app.use('/uploads', [
//   express.static(UPLOAD_IMAGE_FOLDER_PATH, staticOptions),
//   express.static(UPLOAD_VIDEO_FOLDER_PATH, staticOptions)
// ])

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Streaming
// Streaming
// app.get('/videos-streaming/:filename', StreamVideoController.streamVideo)
// app.get('/videos-hls/:foldername/master.m3u8', StreamVideoController.streamMaster)
// app.get('/videos-hls/:foldername/:v/:segment', StreamVideoController.streamSegment)

// API routes
app.use('/api', rootRoute)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 404,
    message: `🔍 - Not Found - ${req.originalUrl}`
  })
})

// Error handler
app.use(errorHandler)

export default app
