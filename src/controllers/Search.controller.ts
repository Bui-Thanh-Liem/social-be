import { Request, Response } from 'express'
import SearchService from '~/services/Search.service'
import { OkResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class SearchController {
  async searchPending(req: Request, res: Response) {
    const results = await SearchService.searchPending({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get trending Success', results))
  }

  async searchTweet(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const tweets = await SearchService.searchTweet({
      query: req.query,
      user_id: user.user_id
    })

    res.status(200).json(new OkResponse('Search tweets Success', tweets))
  }

  async searchUser(req: Request, res: Response) {
    res.status(200).json(new OkResponse('Search tweets Success', true))
  }
}

export default new SearchController()
