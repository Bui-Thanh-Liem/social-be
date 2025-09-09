import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { UserCollection } from '~/models/schemas/User.schema'
import UsersServices from '~/services/Users.service'
import { OkResponse } from '~/shared/classes/response.class'
import { ChangePasswordDto } from '~/shared/dtos/req/user.dto'
import { EUserVerifyStatus } from '~/shared/enums/status.enum'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class UsersController {
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.verifyEmail(user_id)
    res.json(new OkResponse('Verify email Success', result))
  }

  async resendVerifyEmail(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const user = await UserCollection.findOne({ _id: new ObjectId(user_id) })
    if (user?.verify === EUserVerifyStatus.Verified) {
      res.json(new OkResponse('Your email verified', true))
      return
    }

    const result = await UsersServices.resendVerifyEmail(user_id)
    res.json(new OkResponse('Kiểm tra mail để xác minh tài khoản.', result))
  }

  async getOneByUsername(req: Request, res: Response, next: NextFunction) {
    const { username } = req.params
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.getOneByUsername(username, user_id)
    res.json(new OkResponse(`${result} Success`, result))
  }

  async getFollowedUsersBasic(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.getFollowedUsersBasic({ user_id_active: user_id, query: req.query })
    res.json(new OkResponse('Lấy người dùng đang theo dõi mình thành công', result))
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { new_password } = req.body as ChangePasswordDto
    const result = await UsersServices.changePassword(user_id, new_password)
    res.json(new OkResponse(`Change password Success`, result))
  }
}

export default new UsersController()
