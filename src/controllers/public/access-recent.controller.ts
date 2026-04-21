import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import accessRecentService from '~/services/public/access-recents.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class AccessRecentController {
  async create(req: Request, res: Response) {
    const newBadWord = await accessRecentService.create(req.body)
    res.json(new CreatedResponse('Tạo truy cập gần đây thành công', newBadWord))
  }

  async getMulti(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const accessRecent = await accessRecentService.getMulti(user?.user_id, req.query)
    res.json(new OkResponse('Lấy danh sách truy cập gần đây thành công', accessRecent))
  }

  async delete(req: Request, res: Response) {
    const deletedBadWord = await accessRecentService.delete({
      id: req.params.id
    })
    res.json(new OkResponse(`Xóa truy cập gần đây thành công`, deletedBadWord))
  };

  async deleteAll(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const deletedBadWord = await accessRecentService.deleteAll({
      user_id: user?.user_id
    })
    res.json(new OkResponse(`Xóa tất cả truy cập gần đây thành công`, deletedBadWord))
  }
}

export default new AccessRecentController()
