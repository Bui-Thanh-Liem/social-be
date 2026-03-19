import cron from 'node-cron'
import { systemQueue } from '~/infra/queues'
import { CONSTANT_JOB } from '~/shared/constants'

/**
 * 🧹 JOB 1 — Mỗi ngày: kiểm tra xem report có tweet nào cần được xóa không
 */
cron.schedule('0 12 * * *', async () => {
  console.log('[CRON-1D] 🧹 Cleanup old trending started...')
  systemQueue.add(CONSTANT_JOB.DELETE_TWEET_REPORT, {})
  console.log('[CRON-1D] ✅ Kept 100 trending. Deleted old')
})

/**
 * 🧹 JOB 2 — Mỗi 1 phút: lấy dữ liệu likes trong cache để đồng bộ xuống database
 */
cron.schedule('*/1 * * * *', async () => {
  console.log('[CRON-1M] 🧹 Sync likes from cache to DB...')
  systemQueue.add(CONSTANT_JOB.SYNC_LIKE, {})
  console.log('[CRON-1M] ✅ Synced likes from cache to DB')
})

/**
 * 🧹 JOB 3 — Mỗi 15 ngày: Giữ lại 100 trending mới nhất
 */
cron.schedule('0 1 */15 * *', async () => {
  console.log('[CRON-15D] 🧹 Cleanup old trending started...')
  systemQueue.add(CONSTANT_JOB.CLEANUP_OLD_TRENDING, {})
  console.log('[CRON-15D] ✅ Kept 100 trending. Deleted old')
})

/**
 * 🧹 JOB 4 — Mỗi 3 ngày: Xóa trending yếu (count < 10, trong 3 ngày gần nhất)
 */
cron.schedule('0 2 */3 * *', async () => {
  console.log('[CRON-3D] ⚖️ Cleaning weak trending started...')
  systemQueue.add(CONSTANT_JOB.CLEANUP_WEAK_TRENDING, {})
  console.log('[CRON-3D] ✅ Deleted weak trending')
})

/**
 * 🧹 JOB 5 - Mỗi ngày: Xóa thông báo cũ trong 10 ngày (mỗi người dùng sẽ còn 200 tin)
 */
cron.schedule('0 4 * * *', async () => {
  console.log('[CRON-1D] 🧹 Cleanup old notifications started...')
  systemQueue.add(CONSTANT_JOB.CLEANUP_OLD_NOTIFICATIONS, {})
  console.log('[CRON-1D] ✅ Cleanup notifications done.')
})

/**
 * 🧹 JOB 6 — Mỗi 00h: tạo mỗi user 5 tweets
 */
cron.schedule('50 21 * * *', async () => {
  console.log('[CRON-1D] 🧹 Creating mock tweets...')
  systemQueue.add(CONSTANT_JOB.MOCK_DATA, {})
  console.log('[CRON-1D] ✅ Created mock tweets')
})
