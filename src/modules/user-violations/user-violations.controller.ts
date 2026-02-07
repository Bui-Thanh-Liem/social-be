import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import userViolationsService from './user-violations.service'

class UserViolationsController {
  async getMulti(req: Request, res: Response) {
    // const { user_id } = req.decoded_authorization as IJwtPayload
    // Chỉ admin mới được xem danh sách vi phạm của tất cả user
    const results = await userViolationsService.getMulti({ queries: req.query })
    res.status(200).json(new OkResponse('Lấy danh sách vi phạm thành công', results))
  }
}

export default new UserViolationsController()
