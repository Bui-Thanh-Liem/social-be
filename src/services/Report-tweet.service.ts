import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { envs } from '~/configs/env.config'
import { ReportTweetCollection } from '~/models/schemas/Report-tweet.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { BadRequestError } from '~/shared/classes/error.class'
import { CONSTANT_JOB } from '~/shared/constants'
import { ENotificationType } from '~/shared/enums/type.enum'
import TweetsService from './Tweets.service'

class ReportTweetService {
  async report({ reporter_id, tweet_id }: { tweet_id: string; reporter_id: string }) {
    const reporterObjectId = new ObjectId(reporter_id)
    const tweetObjectId = new ObjectId(tweet_id)

    // Kiểm tra xem user đã report chưa
    const existingReport = await ReportTweetCollection.findOne({
      tweet_id: tweetObjectId,
      reporter_ids: reporterObjectId
    })

    if (existingReport) {
      throw new BadRequestError('Bài viết này đã được báo cáo.')
    }

    // Cập nhật hoặc tạo mới report
    const result = await ReportTweetCollection.findOneAndUpdate(
      { tweet_id: tweetObjectId },
      {
        $inc: { report_count: 1 },
        $addToSet: { reporter_ids: reporterObjectId }, // dùng $addToSet thay vì $push
        $setOnInsert: {
          tweet_id: tweetObjectId,
          created_at: new Date()
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    if (!result) {
      throw new BadRequestError('Báo cáo bài viết thất bại')
    }

    const tweet = await TweetCollection.findOne({ _id: tweetObjectId }, { projection: { user_id: 1 } })

    if (!tweet) {
      throw new BadRequestError('Không tìm thấy bài viết bạn báo cáo')
    }

    if (result.report_count >= Number(envs.MAX_REPORT_THRESHOLD)) {
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: `Bài viết của bạn đã vi phạm một số quy tắc cộng đồng, sẽ bị gỡ bỏ trong 12 giờ tới.`,
        type: ENotificationType.Other,
        sender: tweet.user_id.toString(),
        receiver: tweet.user_id.toString(),
        ref_id: tweet._id.toString()
      })
    }

    return result
  }

  async checkTweet() {
    const threshold = Number(envs.MAX_REPORT_THRESHOLD)

    const tweetReportIds = await ReportTweetCollection.find(
      { report_count: { $lt: threshold } },
      { projection: { _id: 1 } }
    ).toArray()

    if (!tweetReportIds?.length) return

    //
    const ids = tweetReportIds.map((t) => t._id)
    const tweet_ids = tweetReportIds.map((t) => t.tweet_id.toString())

    //
    if (tweet_ids.length > 0) {
      await Promise.all([tweet_ids.map((id) => TweetsService.delete(id))])
    }

    //
    await ReportTweetCollection.deleteMany({ _id: { $in: ids } })
  }
}

export default new ReportTweetService()
