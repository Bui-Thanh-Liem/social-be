import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { envs } from '~/configs/env.config'
import { CreatedResponse, OkResponse } from '~/core/success.reponse'
import AuthServices from '~/services/Auth.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class AuthController {
  async signup(req: Request, res: Response) {
    const result = await AuthServices.signup(req.body)
    res.status(201).json(new CreatedResponse('Kiểm tra mail để xác minh tài khoản.', result))
  }

  async login(req: Request, res: Response) {
    const result = await AuthServices.login(req.body)
    res.json(new OkResponse('Đăng nhập thành công', result))
  }

  async googleLogin(req: Request, res: Response) {
    const { code } = req.query
    const { access_token, refresh_token, status } = await AuthServices.googleLogin(code as string)
    const url = `${envs.CLIENT_DOMAIN}/?access_token=${access_token}&refresh_token=${refresh_token}&s=${status}`
    res.redirect(url)
  }

  async facebookLogin(req: Request, res: Response) {
    const { code } = req.query
    const { access_token, refresh_token, status } = await AuthServices.facebookLogin(code as string)
    const url = `${envs.CLIENT_DOMAIN}/?access_token=${access_token}&refresh_token=${refresh_token}&s=${status}`
    res.redirect(url)
  }

  async logout(req: Request, res: Response) {
    const { refresh_token } = req.body
    const { user_id } = req.decoded_refresh_token as IJwtPayload
    const result = await AuthServices.logout({ refresh_token, user_id })
    res.json(new OkResponse('Đăng xuất thành công', !!result.deletedCount))
  }

  async refreshToken(req: Request, res: Response) {
    const { refresh_token } = req.body
    const { user_id, exp } = req.decoded_refresh_token as IJwtPayload
    const result = await AuthServices.refreshToken({ user_id, exp })
    res.json(new OkResponse('Làm mới token thành công', result))
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await AuthServices.forgotPassword(req.body)
    res.json(new OkResponse('Kiểm tra email để đặt lại mật khẩu.', result))
  }

  async resetPassword(req: Request, res: Response) {
    const result = await AuthServices.resetPassword(req?.user?._id as ObjectId, req.body)
    res.json(new OkResponse('Thay đổi mật khẩu thành công', result))
  }

  async getMe(req: Request, res: Response) {
    res.json(new OkResponse('Lấy thông tin của chính mình thành công', req.user))
  }

  async updateMe(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await AuthServices.updateMe(user_id, req.body)
    res.json(new OkResponse('Cập nhật thông tin thành công', result))
  }
}

export default new AuthController()
