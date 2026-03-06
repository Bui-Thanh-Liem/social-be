import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import accessRecentService from './access-recent.service'

class AccessRecentController {
  async create(req: Request, res: Response) {
    const newBadWord = await accessRecentService.create({ body: req.body })
    res.json(new CreatedResponse('Tạo truy cập gần đây thành công', newBadWord))
  }
}

export default new AccessRecentController()
