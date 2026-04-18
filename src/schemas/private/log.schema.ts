import { Collection, Db } from 'mongodb'
import { ILog } from '~/shared/interfaces/private/log.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export const LOG_COLLECTION_NAME = 'logs'
export class LogSchema extends BaseSchema implements ILog {
  action: string
  admin_id: string
  ip_address: string
  user_agent: string

  constructor(log: Pick<LogSchema, 'action' | 'admin_id' | 'ip_address' | 'user_agent'>) {
    super()
    this.action = log.action
    this.admin_id = log.admin_id
    this.ip_address = log.ip_address
    this.user_agent = log.user_agent
  }
}

export let LogsCollection: Collection<LogSchema>

export function initLogsCollection(db: Db) {
  LogsCollection = db.collection<LogSchema>(LOG_COLLECTION_NAME)
}
