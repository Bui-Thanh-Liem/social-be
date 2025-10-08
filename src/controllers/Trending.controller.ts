import { Request, Response } from 'express'
import TrendingService from '~/services/Trending.service'
import { OkResponse } from '~/shared/classes/response.class'
import { ReportTrendingDto } from '~/shared/dtos/req/trending.dto'

class TrendingController {
  async getTrending(req: Request, res: Response) {
    const results = await TrendingService.getTrending({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get trending Success', results))
  }

  async getTodayNews(req: Request, res: Response) {
    const results = await TrendingService.getTodayNews({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get today news Success', results))
  }

  async getOutStandingThisWeekNews(req: Request, res: Response) {
    const results = await TrendingService.getOutStandingThisWeekNews({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get outstanding this week Success', results))
  }

  async report(req: Request, res: Response) {
    const { trending_id } = req.params as ReportTrendingDto
    const results = await TrendingService.report(trending_id)
    res.status(200).json(new OkResponse('Báo cáo xu hướng thành công', results))
  }
}

export default new TrendingController()
