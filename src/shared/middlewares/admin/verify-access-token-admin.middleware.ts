import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'
import AdminService from '~/modules/admin/admin.service'
import { verifyToken } from '~/utils/jwt.util'

export async function verifyAccessTokenAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers['authorization'] || ''
    const access_token = authorization.split(' ')[1]

    if (!access_token) {
      throw new UnauthorizedError('Vui lòng đăng nhập.')
    }
    const decoded = await verifyToken({ token: access_token, privateKey: envs.JWT_SECRET_ACCESS_ADMIN })

    //
    if (decoded.admin_id) {
      const admin = await AdminService.getAdminActive(decoded.admin_id)

      if (!admin) {
        throw new UnauthorizedError('Admin không tồn tại.')
      }

      req.admin = admin
    }

    req.decoded_authorization = decoded
    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
