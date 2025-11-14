import { Request, Response } from 'express'
import SearchService from '~/services/Search.service'
import { OkResponse } from '~/core/success.reponse'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class SearchController {
  async searchPending(req: Request, res: Response) {
    const results = await SearchService.searchPending({
      query: req.query
    })

    res.status(200).json(new OkResponse('Get trending Success', results))
  }

  async searchTweet(req: Request, res: Response) {
    const { user_id } = req?.decoded_authorization as IJwtPayload
    const tweets = await SearchService.searchTweet({
      query: req.query,
      user_id: user_id
    })

    res.status(200).json(new OkResponse('Search tweets Success', tweets))
  }

  async searchUser(req: Request, res: Response) {
    const { user_id } = req?.decoded_authorization as IJwtPayload
    const users = await SearchService.searchUser({ query: req.query, user_id })
    res.status(200).json(new OkResponse('Search users Success', users))
  }
}

export default new SearchController()
