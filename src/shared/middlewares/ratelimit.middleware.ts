// middlewares/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit'

// Rate limit global: 1000 req/15p/IP (dùng cho hầu hết API)
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000,
  // message: {
  //   status: 429,
  //   error: 'Có quá nhiều yêu cầu từ thiết bị này, vui lòng thử lại sau 15 phút nữa.'
  // },
  standardHeaders: true, // Headers RateLimit-*
  legacyHeaders: false, // Không dùng X-RateLimit-* cũ
  skip: (req) => {
    // Bỏ qua rate limit cho localhost hoặc admin IP
    const adminIPs = ['127.0.0.1', '::1']
    return adminIPs.includes(req?.ip || '')
  },
  handler: () => {
    const error: any = new Error('Có quá nhiều yêu cầu từ thiết bị này, vui lòng thử lại sau 15 phút nữa.')
    error.statusCode = 429
    error.type = 'RATE_LIMIT_EXCEEDED'
    throw error
  }
})

// Rate limit nghiêm ngặt cho login: 5 req/5p/IP (chống brute-force)
export const loginRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  // message: {
  //   status: 429,
  //   error: 'Có quá nhiều yêu cầu từ thiết bị của bạn, vui lòng thử lại sau 5 phút nữa.'
  // },
  standardHeaders: true,

  // Dùng handler để ném error vào error middleware
  handler: () => {
    const error: any = new Error('Có quá nhiều yêu cầu từ thiết bị của bạn, vui lòng thử lại sau 5 phút nữa.')
    error.statusCode = 429
    error.type = 'RATE_LIMIT_EXCEEDED'
    throw error
  }
})

// Rate limit nghiêm ngặt cho resend email: 5 req/5p/IP (chống spam mail)
export const resendRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  // message: {
  //   status: 429,
  //   error: 'Có quá nhiều yêu cầu từ thiết bị của bạn, vui lòng thử lại sau 5 phút nữa.'
  // },
  standardHeaders: true,

  // Dùng handler để ném error vào error middleware
  handler: () => {
    const error: any = new Error('Có quá nhiều yêu cầu từ thiết bị của bạn, vui lòng thử lại sau 5 phút nữa.')
    error.statusCode = 429
    error.type = 'RATE_LIMIT_EXCEEDED'
    throw error
  }
})

// Brute force => thử sai mật khẩu nhiều lần
// block mền -> 15/5req, nhập req thứ 6 ở phút thứ 10 thì đợi thêm 5p nữa (sliding window)
// block cứng kể từ khi vi phạm mới bắt đầu tính 15p                      (fixed block time)
// rate-limiter-flexible
