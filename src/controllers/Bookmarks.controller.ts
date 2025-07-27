import { Request, Response } from 'express'
import { ToggleBookmarkDto } from '~/dtos/requests/bookmark.dto'
import BookmarksService from '~/services/Bookmarks.service'
import { CreatedResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class BookmarksController {
  async toggleBookmark(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await BookmarksService.toggleBookmark(user_id, req.params as ToggleBookmarkDto)
    res.status(201).json(new CreatedResponse('Toggle Bookmark Success', result))
  }
}

export default new BookmarksController()
