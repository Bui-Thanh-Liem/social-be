import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { envs } from '~/configs/env.config'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import authService from '~/services/public/auth-user.service'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class AuthController {
  async signup(req: Request, res: Response) {
    const result = await authService.signup(req.body)
    res.status(201).json(new CreatedResponse('Kiểm tra mail để xác minh tài khoản.', result))
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body)
    res.json(new OkResponse('Đăng nhập thành công', result))
  }

  async googleLogin(req: Request, res: Response) {
    const { code } = req.query
    const { access_token, refresh_token, status } = await authService.googleLogin(code as string)
    const url = `${envs.CLIENT_DOMAIN}/?access_token=${access_token}&refresh_token=${refresh_token}&s=${status}`
    res.redirect(url)
  }

  async facebookLogin(req: Request, res: Response) {
    const { code } = req.query
    const { access_token, refresh_token, status } = await authService.facebookLogin(code as string)
    const url = `${envs.CLIENT_DOMAIN}/?access_token=${access_token}&refresh_token=${refresh_token}&s=${status}`
    res.redirect(url)
  }

  async logout(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const { refresh_token } = req.body // Sẽ để ở cookie sau
    const result = await authService.logout({ refresh_token, user_id: user?.user_id })
    res.json(new OkResponse('Đăng xuất thành công', !!result.deletedCount))
  }

  async refreshToken(req: Request, res: Response) {
    const { refresh_token } = req.body // Sẽ để ở cookie sau
    const tokens = await authService.refreshToken({ refresh_token })
    res.json(new OkResponse('Làm mới token thành công.', tokens))
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body)
    res.json(new OkResponse('Kiểm tra email để đặt lại mật khẩu.', result))
  }

  async resetPassword(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const result = await authService.resetPassword(user?.user_id, req.body)
    res.json(new OkResponse('Thay đổi mật khẩu thành công', result))
  }

  async getMeUser(req: Request, res: Response) {
    res.json(new OkResponse('Lấy thông tin của chính mình thành công', req.user))
  }

  async updateMeUser(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const result = await authService.updateMeUser(user?.user_id, req.body)
    res.json(new OkResponse('Cập nhật thông tin thành công', result))
  }
}

export default new AuthController()
