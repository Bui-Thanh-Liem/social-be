import * as os from 'os'
import { clientMongodb, Database } from '~/dbs/init.mongodb'

const _SECONDS = 15000
export function checkOverload() {
  setInterval(async () => {
    const numConnections = await Database.countConnections()
    const numCores = os.cpus().length
    const memoryUsage = process.memoryUsage().rss

    console.log('numCores:::', numCores)
    console.log(`memoryUsage ${memoryUsage / 1024 / 1024} MB`)
    console.log('numConnections:::', numConnections)

    // Cho một core tối đa 3 connect
    const maxConnections = numCores * 3
    if (numConnections > maxConnections - 3) {
      console.error('Quá tải kết nối tới database.')
    }
  }, _SECONDS)
}
