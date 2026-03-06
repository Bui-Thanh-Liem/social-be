import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'
import SearchService from './search.service'
import communitiesService from '../communities/communities.service'

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
      user_id: user?.user_id
    })

    res.status(200).json(new OkResponse('Search tweets Success', tweets))
  }

  async searchUser(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const users = await SearchService.searchUser({ query: req.query, user_id: user?.user_id })
    res.status(200).json(new OkResponse('Search users Success', users))
  }

  async searchCommunity(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const communities = await communitiesService.getMultiExplore({ query: req.query, user_id: user?.user_id })
    res.status(200).json(new OkResponse('Search communities Success', communities))
  }
}

export default new SearchController()
