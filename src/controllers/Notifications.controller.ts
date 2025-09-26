import { NextFunction, Request, Response } from 'express'
import NotificationService from '~/services/Notification.service'
import { OkResponse } from '~/shared/classes/response.class'
import { GetMultiByTypeNotiDto } from '~/shared/dtos/req/notification.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class NotificationsController {
  async getMultiByType(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { type } = req.params as GetMultiByTypeNotiDto
    const result = await NotificationService.getMultiByType({ query: req.query, type, user_id })

    console.log('getMultiByType - type:::', type)
    console.log('getMultiByType - user_id:::', user_id)
    console.log('getMultiByType - result:::', result)

    res.json(new OkResponse(`Lấy nhiều thông báo theo type thành công`, result))
  }
}

export default new NotificationsController()
