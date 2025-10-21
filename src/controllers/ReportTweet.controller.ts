import { Request, Response } from 'express'
import ReportTweetService from '~/services/ReportTweet.service'
import { CreatedResponse } from '~/shared/classes/response.class'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

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
