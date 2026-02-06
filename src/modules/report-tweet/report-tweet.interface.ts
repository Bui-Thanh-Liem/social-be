import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/schemas/base.interface'

export interface IReportTweet extends IBase {
  reason: string
  tweet_id: ObjectId
  report_count: number
  reporter_ids: ObjectId[]
}
