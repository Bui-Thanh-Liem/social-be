import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import { ParamIdTweetDto } from '~/modules/tweets/tweets.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import ReportTweetService from './report-tweet.service'

class ReportTweetController {
  async report(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { tweet_id } = req.params as ParamIdTweetDto
    const result = await ReportTweetService.report({ reporter_id: user_id, tweet_id: tweet_id })
    res.json(
      new CreatedResponse(
        'Báo cáo bài viết thành công, tạm thời bài viết sẽ bị gỡ khỏi dòng thời gian của bạn.',
        result
      )
    )
  }
}

export default new ReportTweetController()
