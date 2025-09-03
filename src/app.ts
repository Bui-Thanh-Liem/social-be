import compression from 'compression'
import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import swaggerUi from 'swagger-ui-express'

//
import { swaggerSpec } from './configs/swagger'
import { corsMiddleware } from './middlewares/cors.middleware'
import { errorHandler } from './middlewares/errorhandler.middleware'
import { rateLimitMiddleware } from './middlewares/ratelimit.middleware'
import rootRoute from './routes'
import { UPLOAD_IMAGE_FOLDER_PATH, UPLOAD_VIDEO_FOLDER_PATH } from './shared/constants'
import morgan from 'morgan'
import { loggerMiddleware } from './middlewares/logger.middleware'
import { logger } from './utils/logger.util'

const app = express()

// Tin tưởng 1 proxy (nginx/traefik)
app.set('trust proxy', 1)

// Cookie
// app.use(session({
//   secret: "keyboard cat",
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }  // chỉ gửi cookie qua HTTPS
// }))

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.socket.io'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    }
  })
)

// Nén response body bằng thuật toán gzip/deflate trước khi gửi trả.
app.use(compression())
app.use(hpp()) // page=1&page=4 => thì lấy page=4

//
app.use(morgan('dev'))
app.use(loggerMiddleware)

// CORS
app.use(corsMiddleware)

// Rate limiting
app.use(rateLimitMiddleware)

// Body parsing
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    logger.info("req.is('multipart/form-data'):::", req.is('multipart/form-data'))
    return next()
  }
  express.json({ limit: '10mb' })(req, res, next) // application/json
})
app.use(express.urlencoded({ extended: true, limit: '10mb' })) // application/x-www-form-urlencoded

// Static files
app.use(express.static(UPLOAD_IMAGE_FOLDER_PATH)) // Static file serving
app.use(express.static(UPLOAD_VIDEO_FOLDER_PATH)) // Static file serving

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API routes
app.use('/', rootRoute)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `🔍 - Not Found - ${req.originalUrl}`
  })
})

// Error handler
app.use(errorHandler)

export default app
