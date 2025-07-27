import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { UserCollection } from '~/models/schemas/User.schema'
import UsersServices from '~/services/Users.service'
import { OkResponse } from '~/shared/classes/response.class'
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
    res.json(new OkResponse('Resend verify email Success', result))
  }

  async getIdByUsername(req: Request, res: Response, next: NextFunction) {
    const { username } = req.params
    const result = await UsersServices.getIdByUsername(username)
    res.json(new OkResponse(`${result} Success`, result))
  }
}

export default new UsersController()
