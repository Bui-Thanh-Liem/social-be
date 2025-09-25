// middlewares/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit'

// Giới hạn: 1000 request mỗi 15 phút / IP
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // tối đa 100 requests/IP
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  },
  headers: true // gửi thêm headers RateLimit-* cho client
})
