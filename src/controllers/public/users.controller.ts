import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { OkResponse } from '~/core/success.response'
import { ChangePasswordDto, UserIdDto, verifyEmailDto } from '~/dtos/public/users.dto'
import { EUserVerifyStatus } from '~/enums/public/user.enum'
import { UsersCollection } from '~/models/public/users.schema'
import usersService from '~/services/public/users.service'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class UsersController {
  async verifyEmail(req: Request, res: Response) {
    const { email_verify_token } = req.body as verifyEmailDto
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await usersService.verifyEmail({ user_id: user_id!, email_verify_token })
    res.json(new OkResponse(`Xác thực email ${result.email} thành công.`, result))
  }

  async resendVerifyEmail(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const user = await UsersCollection.findOne({ _id: new ObjectId(user_id) })
    if (user?.verify === EUserVerifyStatus.Verified) {
      res.json(new OkResponse('Email của bạn đã xác được xác thực.', true))
      return
    }

    const result = await usersService.resendVerifyEmail(user_id!)
    res.json(new OkResponse('Kiểm tra mail để xác minh tài khoản.', result))
  }

  async getTopFollowedUsers(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await usersService.getTopFollowedUsers({ query: req.query, user_id: user_id! })
    res.json(new OkResponse('Lấy người dùng có nhiều người theo dõi thành công', result))
  }

  async getOneByUsername(req: Request, res: Response) {
    const { username } = req.params
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await usersService.getOneByUsername(username, user_id!)
    res.json(new OkResponse(`${result} Thành công`, result))
  }

  async getMultiForMentions(req: Request, res: Response) {
    const { username } = req.params
    const result = await usersService.getMultiForMentions(username)
    res.json(new OkResponse(`${result} Thành công`, result))
  }

  async getFollowedUsersBasic(req: Request, res: Response) {
    const { user_id } = req.params as UserIdDto
    const result = await usersService.getFollowedUsersBasic({ user_id, query: req.query })
    res.json(new OkResponse('Lấy người dùng đang theo dõi mình thành công', result))
  }

  async getFollowingUsersBasic(req: Request, res: Response) {
    const result = await usersService.getFollowingUsersBasic({ id: req.params.id, query: req.query })
    res.json(new OkResponse('Lấy người dùng mình đang theo dõi thành công', result))
  }

  async getGuestUsers(req: Request, res: Response) {
    const result = await usersService.getGuestUsers()
    res.json(new OkResponse('Lấy người dùng khách thành công', result))
  }

  async changePassword(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { new_password } = req.body as ChangePasswordDto
    const result = await usersService.changePassword(user_id!, new_password)
    res.json(new OkResponse(`Thay đổi mật khẩu thành công.`, result))
  }
}

export default new UsersController()
