import { ObjectId } from 'mongodb'
import { IBase } from './base.interface'

export interface IReportTweet extends IBase {
  reason: string
  tweet_id: ObjectId
  report_count: number
  reporter_ids: ObjectId[]
}
