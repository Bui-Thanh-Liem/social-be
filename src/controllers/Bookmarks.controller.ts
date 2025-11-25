import { Request, Response } from 'express'
import BookmarksService from '~/services/Bookmarks.service'
import { CreatedResponse } from '~/core/success.response'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class BookmarksController {
  async toggleBookmark(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await BookmarksService.toggleBookmark(user_id, req.params as ParamIdTweetDto)
    res.status(201).json(new CreatedResponse('Toggle Bookmark Success', result))
  }
}

export default new BookmarksController()
