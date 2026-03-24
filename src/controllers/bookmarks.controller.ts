import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import { ParamIdTweetDto } from '~/dtos/tweets.dto'
import bookmarksService from '~/services/bookmarks.service'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class BookmarksController {
  async toggleBookmark(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await bookmarksService.toggleBookmark(user_id, req.params as ParamIdTweetDto)
    res.status(201).json(new CreatedResponse('Toggle Bookmark Success', result))
  }
}

export default new BookmarksController()
