import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { ReportTrendingDto } from '~/shared/dtos/public/trending.dto'
import trendingService from '~/services/public/trending.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class TrendingController {
  async getTrending(req: Request, res: Response) {
    const results = await trendingService.getTrending({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get trending Success', results))
  }

  async getTodayNews(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const results = await trendingService.getTodayNews({ user_id: user?.user_id, query: req.query })
    res.status(200).json(new OkResponse('Get today news Success', results))
  }

  async getOutStandingThisWeekNews(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const results = await trendingService.getOutStandingThisWeekNews({ user_id: user?.user_id, query: req.query })
    res.status(200).json(new OkResponse('Get outstanding this week Success', results))
  }

  async getTweetsByIds(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const results = await trendingService.getTweetsByIds({ user_active_id: user?.user_id, query: req.query })
    res.status(200).json(new OkResponse('Get tweets by ids Success', results))
  }

  async report(req: Request, res: Response) {
    const { trending_id } = req.params as ReportTrendingDto
    const results = await trendingService.report(trending_id)
    res.status(200).json(new OkResponse('Báo cáo xu hướng thành công', results))
  }
}

export default new TrendingController()
