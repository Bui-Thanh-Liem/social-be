import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { UserCollection } from '~/models/schemas/User.schema'
import UsersServices from '~/services/Users.service'
import { OkResponse } from '~/core/success.reponse'
import { ChangePasswordDto, UserIdDto } from '~/shared/dtos/req/user.dto'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class UsersController {
  async verifyEmail(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.verifyEmail(user_id)
    res.json(new OkResponse(`Xác thực email ${result.email} thành công.`, result))
  }

  async resendVerifyEmail(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const user = await UserCollection.findOne({ _id: new ObjectId(user_id) })
    if (user?.verify === EUserVerifyStatus.Verified) {
      res.json(new OkResponse('Email của bạn đã xác được xác thực.', true))
      return
    }

    const result = await UsersServices.resendVerifyEmail(user_id)
    res.json(new OkResponse('Kiểm tra mail để xác minh tài khoản.', result))
  }

  async getTopFollowedUsers(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.getTopFollowedUsers({ query: req.query, user_id })
    res.json(new OkResponse('Lấy người dùng có nhiều người theo dõi thành công', result))
  }

  async getOneByUsername(req: Request, res: Response) {
    const { username } = req.params
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.getOneByUsername(username, user_id)
    res.json(new OkResponse(`${result} Thành công`, result))
  }

  async getMultiForMentions(req: Request, res: Response) {
    const { username } = req.params
    const result = await UsersServices.getMultiForMentions(username)
    res.json(new OkResponse(`${result} Thành công`, result))
  }

  async getFollowedUsersBasic(req: Request, res: Response) {
    const { user_id } = req.params as UserIdDto
    const result = await UsersServices.getFollowedUsersBasic({ user_id, query: req.query })
    res.json(new OkResponse('Lấy người dùng đang theo dõi mình thành công', result))
  }

  async getFollowingUsersBasic(req: Request, res: Response) {
    const { user_id } = req.params as UserIdDto
    const result = await UsersServices.getFollowingUsersBasic({ user_id, query: req.query })
    res.json(new OkResponse('Lấy người dùng mình đang theo dõi thành công', result))
  }

  async changePassword(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { new_password } = req.body as ChangePasswordDto
    const result = await UsersServices.changePassword(user_id, new_password)
    res.json(new OkResponse(`Thay đổi mật khẩu thành công.`, result))
  }
}

export default new UsersController()
