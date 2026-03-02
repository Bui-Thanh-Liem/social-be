import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import communitiesService from '../communities/communities.service'
import MediaService from '../media/media.service'
import TweetsService from '../tweets/tweets.service'
import UsersService from '../users/users.service'
import AdminService from './admin.service'

class AdminController {
  //
  async login(req: Request, res: Response) {
    const { data, message } = await AdminService.login(req.body)
    res.json(new OkResponse(message, data))
  }

  //
  async logout(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await AdminService.logout({ admin_id })
    res.json(new OkResponse('Đăng xuất thành công', result))
  }

  //
  async setupTwoFactorAuth(req: Request, res: Response) {
    const result = await AdminService.setupTwoFactorAuth({
      admin_id: req.params.admin_id
    })
    res.json(new OkResponse('Cài đặt xác thực hai yếu tố thành công', result))
  }

  //
  async activeTwoFactorAuth(req: Request, res: Response) {
    const result = await AdminService.activeTwoFactorAuth({ token: req.body.token, admin_id: req.params.admin_id })
    res.json(new OkResponse('Kích hoạt xác thực hai yếu tố thành công', result))
  }

  //
  async verifyTwoFactorAuth(req: Request, res: Response) {
    const result = await AdminService.verifyTwoFactorAuth({ token: req.body.token, admin_id: req.params.admin_id })
    res.json(new OkResponse('Xác thực hai yếu tố thành công', result))
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
