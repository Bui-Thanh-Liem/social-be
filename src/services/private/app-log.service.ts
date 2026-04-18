import { LogSchema, LogsCollection } from '~/schemas/private/log.schema'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ILog } from '~/shared/interfaces/private/log.interface'
import { getFilterQuery } from '~/utils/get-filter-query.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'

class LogService {
  async createLog(logData: Pick<ILog, 'action' | 'admin_id' | 'ip_address' | 'user_agent'>): Promise<ILog> {
    const log = new LogSchema(logData)
    const result = await LogsCollection.insertOne(log)
    return { ...log, _id: result.insertedId }
  }

  async getMulti({ query }: { query: IQuery<ILog> }) {
    const { skip, limit, sort, sd, ed, qf } = getPaginationAndSafeQuery<ILog>(query)
    let filter: Partial<Record<keyof ILog, any>> = {}

    // Áp dụng filter từ qf nếu có
    filter = getFilterQuery({ qf, filter, sd, ed })

    const [logs, total] = await Promise.all([
      LogsCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      LogsCollection.countDocuments(filter)
    ])

    return { total, total_page: Math.ceil(total / limit), items: logs }
  }
}

export default new LogService()
