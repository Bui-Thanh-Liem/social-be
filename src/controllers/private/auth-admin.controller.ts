import { Request, Response } from 'express'
import { OkResponse } from '../../core/success.response'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'
import authAdminService from '~/services/private/auth-admin.service'

class AuthAdminController {
  //
  async login(req: Request, res: Response) {
    const { data, message } = await authAdminService.login(req.body)
    res.json(new OkResponse(message, data))
  }

  //
  async logout(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await authAdminService.logout({ admin_id })
    res.json(new OkResponse('Đăng xuất thành công', result))
  }

  //
  async setupTwoFactorAuth(req: Request, res: Response) {
    const result = await authAdminService.setupTwoFactorAuth({
      admin_id: req.params.admin_id as string
    })
    res.json(new OkResponse('Cài đặt xác thực hai yếu tố thành công', result))
  }

  //
  async activeTwoFactorAuth(req: Request, res: Response) {
    const result = await authAdminService.activeTwoFactorAuth({
      token: req.body.token,
      admin_id: req.params.admin_id as string
    })
    res.json(new OkResponse('Kích hoạt xác thực hai yếu tố thành công', result))
  }

  //
  async verifyTwoFactorAuth(req: Request, res: Response) {
    const result = await authAdminService.verifyTwoFactorAuth({
      token: req.body.token,
      admin_id: req.params.admin_id as string
    })
    res.json(new OkResponse('Xác thực hai yếu tố thành công', result))
  }

  //
  async getMe(req: Request, res: Response) {
    res.json(new OkResponse('Lấy thông tin của chính mình thành công', req.admin))
  }
}

export default new AuthAdminController()
