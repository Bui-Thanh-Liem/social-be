import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'
import AccessRecentService from './access-recent.service'

class AccessRecentController {
  async create(req: Request, res: Response) {
    const newBadWord = await AccessRecentService.create(req.body)
    res.json(new CreatedResponse('Tạo truy cập gần đây thành công', newBadWord))
  }

  async getMulti(req: Request, res: Response) {
    const accessRecent = await AccessRecentService.getMulti(req.queryParsed)
    res.json(new OkResponse('Lấy danh sách truy cập gần đây thành công', accessRecent))
  }

  async delete(req: Request, res: Response) {
    const deletedBadWord = await AccessRecentService.delete({
      access_recent_id: req.params.access_recent_id
    })
    console.log('AccessRecentController - delete :::', deletedBadWord)

    res.json(new OkResponse(`Xóa truy cập gần đây thành công`, deletedBadWord))
  }

  async deleteAll(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const deletedBadWord = await AccessRecentService.deleteAll({
      user_id
    })
    console.log('AccessRecentController - deleteAll :::', deletedBadWord)
    res.json(new OkResponse(`Xóa tất cả truy cập gần đây thành công`, deletedBadWord))
  }
}

export default new AccessRecentController()
