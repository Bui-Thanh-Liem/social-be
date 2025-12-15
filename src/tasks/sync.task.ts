import cron from 'node-cron'
import { syncQueue } from '~/bull/queues'
import { CONSTANT_JOB } from '~/shared/constants'

/**
 * 🧹 JOB 1 — Mỗi 2 phút: lấy dữ liệu trong cache để đồng bộ xuống database
 */
cron.schedule('*/2 * * * *', async () => {
  console.log('[CRON-2M] 🧹 Sync likes from cache to DB...')
  syncQueue.add(CONSTANT_JOB.SYNC_LIKE, {})
  console.log('[CRON-2M] ✅ Synced likes from cache to DB')
})
