import cron from 'node-cron'
import NotificationService from '~/modules/notifications/notifications.service'
import TrendingService from '~/modules/trending/trending.service'

// Sẽ làm trong worker sau ()

/**
 * 🧹 JOB 1 — Mỗi 15 ngày: Giữ lại 100 trending mới nhất
 */
cron.schedule('0 1 */15 * *', async () => {
  console.log('[CRON-15D] 🧹 Cleanup old trending started...')
  await TrendingService.cleanupOldTrending()
  console.log('[CRON-15D] ✅ Kept 100 trending. Deleted old')
})

/**
 * 🧹 JOB 2 — Mỗi 3 ngày: Xóa trending yếu (count < 10, trong 3 ngày gần nhất)
 */
cron.schedule('0 2 */3 * *', async () => {
  console.log('[CRON-3D] ⚖️ Cleaning weak trending started...')
  await TrendingService.cleanupWeakTrending()
  console.log('[CRON-3D] ✅ Deleted weak trending')
})

/**
 * 🧹 JOB 4 - Mỗi ngày: Xóa thông báo cũ trong 10 ngày (mỗi người dùng sẽ còn 200 tin)
 */
cron.schedule('0 4 * * *', async () => {
  console.log('[CRON] 🧹 Cleanup old notifications started...')
  await NotificationService.cleanupOldNotifications()
  console.log('[CRON] ✅ Cleanup notifications done.')
})
