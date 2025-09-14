import cors from 'cors'
import { envs } from '../configs/env.config'

// Danh sách các origin được phép
const allowedOrigins = [
  envs.CLIENT_DOMAIN || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://127.0.0.1:3000'
  // Thêm các domain production của bạn
]

export const corsMiddleware = cors({
  origin: (origin, callback) => {
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
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
})
