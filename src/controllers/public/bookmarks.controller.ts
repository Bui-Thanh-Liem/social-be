import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import bookmarksService from '~/services/public/bookmarks.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class BookmarksController {
  async toggleBookmark(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await bookmarksService.toggleBookmark(user_id, req.params.id)
    res.status(201).json(new CreatedResponse('Toggle Bookmark Success', result))
  }
}

export default new BookmarksController()
