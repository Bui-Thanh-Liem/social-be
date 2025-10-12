import cron from 'node-cron'
import ReportTweetService from '~/services/ReportTweet.service'

/**
 * 🧹 JOB 1 — Mỗi ngày: kiểm tra xem report có tweet nào cần được xóa không
 */
cron.schedule('0 12 * * *', async () => {
  console.log('[CRON-15D] 🧹 Cleanup old trending started...')
  await ReportTweetService.checkTweet()
  console.log('[CRON-15D] ✅ Kept 100 trending. Deleted old')
})
