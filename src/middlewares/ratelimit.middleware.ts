// middlewares/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit'

// Rate limit global: 1000 req/15p/IP (dùng cho hầu hết API)
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000,
  message: {
    status: 429,
    error: 'Có quá nhiều yêu cầu từ thiết bị này, vui lòng thử lại sau 15 phút nữa.'
  },
  standardHeaders: true, // Headers RateLimit-*
  legacyHeaders: false, // Không dùng X-RateLimit-* cũ
  skip: (req) => {
    // Bỏ qua rate limit cho localhost hoặc admin IP
    const adminIPs = ['127.0.0.1', '::1']
    return adminIPs.includes(req?.ip || '')
  }
})

// Rate limit nghiêm ngặt cho login: 5 req/5p/IP (chống brute-force)
export const loginRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    error: 'Có quá nhiều yêu cầu từ thiết bị này, vui lòng thử lại sau 5 phút nữa.'
  },
  standardHeaders: true
})

// Brute force => thử sai mật khẩu nhiều lần
// block mền -> 15/5req, nhập req thứ 6 ở phút thứ 10 thì đợi thêm 5p nữa (sliding window)
// block cứng kể từ khi vi phạm mới bắt đầu tính 15p                      (fixed block time)
// rate-limiter-flexible

// =========== DDoS ================ Lượng truy cập cao ====================
// DDoS = nhiều máy gửi request ồ ạt → server quá tải → web sập

// Dùng CDN/WAF (như Cloudflare, AWS CloudFront, Fastly)
// → Lọc bot, cache nội dung, chặn request lạ từ đầu vào.

// Rate limiting (giới hạn tần suất) (phải cực kì hợp lý)
// → Ví dụ: chỉ cho 5 request/giây / IP. - /login

// Firewall / iptables / Nginx limit
// → Giới hạn kết nối TCP hoặc request thô ở tầng hệ thống.

// Detect & alert (phát hiện sớm)
// → Nếu traffic tăng đột biến → gửi cảnh báo (qua mail, Slack…).

// Queue & worker - Cache hợp lý  - Docker Swarm (mở nhiều instance lên)
// → Nếu request nhiều quá thì đưa vào hàng đợi để xử lý dần, tránh nghẽn app chính.

// Monitoring
// → Theo dõi RPS, CPU, RAM, network traffic để biết khi nào bị tấn công.
