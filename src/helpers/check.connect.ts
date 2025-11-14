import * as os from 'os'
import { Database } from '~/dbs/init.mongodb'
import { BadRequestError } from '~/shared/classes/error.class'

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
      throw new BadRequestError('Quá tải kết nối')
    }
  }, _SECONDS)
}
