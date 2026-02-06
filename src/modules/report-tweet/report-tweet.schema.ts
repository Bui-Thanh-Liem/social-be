import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IReportTweet } from './report-tweet.interface'

export class ReportTweetSchema extends BaseSchema implements IReportTweet {
  reason: string
  tweet_id: ObjectId
  report_count: number
  reporter_ids: ObjectId[]

  constructor(bookmark: Partial<IReportTweet>) {
    super()
    this.reason = bookmark.reason || ''
    this.tweet_id = bookmark.tweet_id || new ObjectId()
    this.reporter_ids = bookmark.reporter_ids || [new ObjectId()]
    this.report_count = bookmark.report_count || 1
  }
}

export let ReportTweetCollection: Collection<ReportTweetSchema>

export function initReportTweetCollection(db: Db) {
  ReportTweetCollection = db.collection<ReportTweetSchema>('tweet-reports')
}
