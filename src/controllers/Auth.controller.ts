import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { envs } from '~/configs/env.config'
import AuthServices from '~/services/Auth.service'
import UsersServices from '~/services/Users.service'
import { CreatedResponse, OkResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class AuthController {
  async register(req: Request, res: Response) {
    const result = await AuthServices.register(req.body)
    res.status(201).json(new CreatedResponse('Register Success', result))
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthServices.login(req.body)
      res.json(new OkResponse('Login Success', result))
    } catch (error) {
      next(error)
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    const { code } = req.query
    const { access_token, refresh_token, status } = await AuthServices.googleLogin(code as string)
    const url = `${envs.CLIENT_DOMAIN}/?access_token=${access_token}&refresh_token=${refresh_token}&s=${status}`
    res.redirect(url)
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const { refresh_token } = req.body
    const { user_id } = req.decoded_refresh_token as IJwtPayload
    const result = await AuthServices.logout({ refresh_token, user_id })
    res.json(new OkResponse('Logout Success', !!result.deletedCount))
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    const { refresh_token } = req.body
    const { user_id, exp } = req.decoded_refresh_token as IJwtPayload
    const result = await AuthServices.refreshToken({ user_id, token: refresh_token, exp })
    res.json(new OkResponse('Refresh token Success', result))
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const result = await AuthServices.forgotPassword(req.body)
    res.json(new OkResponse('Forgot password Success', result))
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    const result = await AuthServices.resetPassword(req?.user?._id as ObjectId, req.body)
    res.json(new OkResponse('Reset password Success', result))
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await AuthServices.getMe(user_id)
    res.json(new OkResponse('Get Me Success', result))
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UsersServices.updateMe(user_id, req.body)
    res.json(new OkResponse('Update me Success', result))
  }
}

export default new AuthController()
