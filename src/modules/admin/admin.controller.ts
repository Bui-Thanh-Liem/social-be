import { Request, Response } from 'express'
import AdminService from './admin.service'
import { OkResponse } from '~/core/success.response'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import MediaService from '../media/media.service'
import UsersService from '../users/users.service'
import TweetsService from '../tweets/tweets.service'
import communitiesService from '../communities/communities.service'
import { IAdmin } from './admin.interface'

class AdminController {
  //
  async login(req: Request, res: Response) {
    const result = await AdminService.login(req.body)
    res.json(new OkResponse('Đăng nhập thành công', result))
  }

  //
  async logout(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await AdminService.logout({ admin_id })
    res.json(new OkResponse('Đăng xuất thành công', result))
  }

  //
  async setupTwoFactorAuth(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const { email } = req.admin as IAdmin
    const result = await AdminService.setupTwoFactorAuth({
      admin_id,
      email
    })
    res.json(new OkResponse('Cài đặt xác thực hai yếu tố thành công', result))
  }

  //
  async activeTwoFactorAuth(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const { token } = req.body
    await AdminService.activeTwoFactorAuth({ admin_id, token })
    res.json(new OkResponse('Kích hoạt xác thực hai yếu tố thành công'))
  }

  //
  async loginWithTwoFactorAuth(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const { token } = req.body
    await AdminService.loginWithTwoFactorAuth({ admin_id, token })
    res.json(new OkResponse('Xác thực hai yếu tố thành công'))
  }

  //
  async geMe(req: Request, res: Response) {
    res.json(new OkResponse('Lấy thông tin của chính mình thành công', req.admin))
  }

  //
  async adminGetUsers(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersService.adminGetUsers({
      admin_id,
      query: req.queryParsed
    })
    res.json(new OkResponse('Lấy danh sách người dùng thành công', result))
  }

  //
  async adminGetMedia(req: Request, res: Response) {
    // const { admin_id } = req.admin_decoded_authorization as IJwtPayload
    const result = await MediaService.adminGetMedia({ admin_id: '', query: req.queryParsed })
    res.json(new OkResponse('Lấy danh sách hình ảnh / video thành công', result))
  }

  //
  async adminGetTweets(req: Request, res: Response) {
    // const { admin_id } = req.admin_decoded_authorization as IJwtPayload
    const result = await TweetsService.adminGetTweets({ admin_id: '', query: req.queryParsed })
    res.json(new OkResponse('Lấy danh sách bài viết thành công', result))
  }

  //
  async adminGetCommunities(req: Request, res: Response) {
    // const { admin_id } = req.admin_decoded_authorization as IJwtPayload
    const result = await communitiesService.adminGetCommunities({ admin_id: '', query: req.query })
    res.json(new OkResponse('Lấy danh sách cộng đồng thành công', result))
  }
}

export default new AdminController()
