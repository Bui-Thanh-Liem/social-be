import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import { ParamIdTweetDto } from '~/modules/tweets/tweets.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import BookmarksService from './bookmarks.service'

class BookmarksController {
  async toggleBookmark(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await BookmarksService.toggleBookmark(user_id, req.params as ParamIdTweetDto)
    res.status(201).json(new CreatedResponse('Toggle Bookmark Success', result))
  }
}

export default new BookmarksController()
