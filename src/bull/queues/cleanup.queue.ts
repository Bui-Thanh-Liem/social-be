import { Queue } from 'bullmq'
import { redisConnection } from '~/configs/redis.config'
import { CONSTANT_QUEUE } from '~/shared/constants'

export const cleanupQueue = new Queue(CONSTANT_QUEUE.CLEANUP, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Thử lại tối đa 3 lần nếu job thất bại
    backoff: { type: 'exponential', delay: 1000 }, // Delay tăng dần theo lũy thừa (1s, 2s, 4s,...) || fixed
    removeOnComplete: true, // Xóa job khỏi Redis khi hoàn thành
    // removeOnFail: true, // Xóa job khỏi Redis sau khi thất bại (sau 3 lần)
    removeOnFail: { age: 3600 }, // giữ trong 1h rồi xóa
    delay: 1000 // Delay mặc định 1 giây trước khi job bắt đầu chạy
  }
})

// 🔹 Dev / staging / app nhỏ → Multi-worker single process
// 🔹 Production / hệ thống lớn → Dedicated worker process (1 queue = 1 process).
