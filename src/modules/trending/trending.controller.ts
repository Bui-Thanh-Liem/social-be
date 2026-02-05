import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { ReportTrendingDto } from '~/modules/trending/trending.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import TrendingService from './trending.service'

class TrendingController {
  async getTrending(req: Request, res: Response) {
    const results = await TrendingService.getTrending({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get trending Success', results))
  }

  async getTodayNews(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const results = await TrendingService.getTodayNews({ user_id, query: req.query })

    res.status(200).json(new OkResponse('Get today news Success', results))
  }

  async getOutStandingThisWeekNews(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const results = await TrendingService.getOutStandingThisWeekNews({ user_id, query: req.query })
    res.status(200).json(new OkResponse('Get outstanding this week Success', results))
  }

  async getTweetsByIds(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const results = await TrendingService.getTweetsByIds({ user_active_id: user_id, query: req.query })
    res.status(200).json(new OkResponse('Get tweets by ids Success', results))
  }

  async report(req: Request, res: Response) {
    const { trending_id } = req.params as ReportTrendingDto
    const results = await TrendingService.report(trending_id)
    res.status(200).json(new OkResponse('Báo cáo xu hướng thành công', results))
  }
}

export default new TrendingController()
