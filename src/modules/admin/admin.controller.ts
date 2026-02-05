import { Request, Response } from 'express'
import AdminService from './admin.service'
import { OkResponse } from '~/core/success.response'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import mediaService from '../media/media.service'

class AdminController {
  //
  async login(req: Request, res: Response) {
    const result = await AdminService.login(req.body)
    res.json(new OkResponse('Đăng nhập thành công', result))
  }

  //
  async geMe(req: Request, res: Response) {
    res.json(new OkResponse('Lấy thông tin của chính mình thành công', req.admin))
  }

  //
  async adminGetUsers(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await AdminService.adminGetUsers({
      admin_id,
      query: req.query
    })
    res.json(new OkResponse('Lấy danh sách người dùng thành công', result))
  }

  //
  async adminGetMedia(req: Request, res: Response) {
    // const { admin_id } = req.admin_decoded_authorization as IJwtPayload
    const result = await mediaService.adminGetMedia({ admin_id: '', query: req.query })
    res.json(new OkResponse('Lấy danh sách hình ảnh / video thành công', result))
  }
}

export default new AdminController()
