import { Request, Response } from 'express'
import NotificationService from '~/services/Notification.service'
import { OkResponse } from '~/core/success.reponse'
import { DelNotiDto, GetMultiByTypeNotiDto, ReadNotiDto } from '~/shared/dtos/req/notification.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class NotificationsController {
  async getMultiByType(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { type } = req.params as GetMultiByTypeNotiDto
    const result = await NotificationService.getMultiByType({ query: req.query, type, user_id })
    res.json(new OkResponse(`Lấy tất thông báo theo type thành công`, result))
  }

  async delete(req: Request, res: Response) {
    const { noti_id } = req.params as DelNotiDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await NotificationService.delete(noti_id, user_id)
    res.json(new OkResponse(`Xóa thông báo thành công`, result))
  }

  async read(req: Request, res: Response) {
    const { noti_id } = req.params as ReadNotiDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await NotificationService.read(noti_id, user_id)
    res.json(new OkResponse(`Đọc thông báo thành công`, result))
  }
}

export default new NotificationsController()
