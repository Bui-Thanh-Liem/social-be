import cors from 'cors'
import { envs } from '../configs/env.config'

// Danh sách các origin được phép
export const allowedOrigins = [envs.CLIENT_DOMAIN, envs.CLIENT_DOMAIN_ADMIN]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      console.log('✅ No origin - allowed (direct access or same-origin)')
      return callback(null, true)
    }

    // Cho phép requests không có origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Cho phép cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'Accept',
    'Pragma',
    'x-client-id', // kiểm tra sau
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
})
