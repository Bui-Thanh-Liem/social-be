import cron from 'node-cron'
import { startMockTweets } from '~/utils/mock-data.util'

/**
 * 🧹 JOB 1 — Mỗi 00h: tạo mỗi user 5 tweets
 */
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON-1M] 🧹 Creating mock tweets...')
  startMockTweets()
  console.log('[CRON-1M] ✅ Created mock tweets')
})
