import { NextFunction, Request, Response } from 'express'
import HashtagsService from '~/services/Hashtags.service'
import { OkResponse } from '~/shared/classes/response.class'

class HashtagsController {
  async getMulti(req: Request, res: Response, next: NextFunction) {
    const result = await HashtagsService.getMulti({ query: req.query })
    res.json(new OkResponse(`Lấy nhiều hashtags thành công`, result))
  }
}

export default new HashtagsController()
