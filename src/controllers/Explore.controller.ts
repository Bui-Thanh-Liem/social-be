import { Request, Response } from 'express'
import ExploreService from '~/services/Explore.service'
import { OkResponse } from '~/shared/classes/response.class'

class ExploreController {
  async getTrending(req: Request, res: Response) {
    const results = await ExploreService.getTrending({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get trending Success', results))
  }

  async getTodayNews(req: Request, res: Response) {
    const results = await ExploreService.getTodayNews({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get today news Success', results))
  }
}

export default new ExploreController()
