import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { GetMultiByTypeNotiDto } from '~/shared/dtos/public/notifications.dto'
import NotificationService from '~/services/public/notifications.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class NotificationsController {
  async getMultiByType(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { type } = req.params as GetMultiByTypeNotiDto
    const result = await NotificationService.getMultiByType({ query: req.query, type, user_id: user_id! })
    res.json(new OkResponse(`Lấy tất thông báo theo type thành công`, result))
  }

  async delete(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { id } = req.params
    const result = await NotificationService.delete(id, user_id!)
    res.json(new OkResponse(`Xóa thông báo thành công`, result))
  }

  async read(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { id } = req.params
    const result = await NotificationService.read(id, user_id!)
    res.json(new OkResponse(`Đọc thông báo thành công`, result))
  }
}

export default new NotificationsController()
