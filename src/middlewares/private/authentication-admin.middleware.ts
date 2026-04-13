import { NextFunction, Request, Response } from 'express'
import { envs } from '~/configs/env.config'
import { UnauthorizedError } from '~/core/error.response'
import adminTokensService from '~/services/private/admin-tokens.service'
import adminService from '~/services/private/admins.service'
import { verifyToken } from '~/utils/jwt.util'

export async function authenticationAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers['authorization'] || ''
    const token = authorization.split(' ')[1]

    if (!token) {
      throw new UnauthorizedError('Vui lòng đăng nhập.')
    }
    const decoded = await verifyToken({
      token,
      private_key: envs.JWT_SECRET_ACCESS_ADMIN
    })

    //
    if (decoded.admin_id) {
      const [admin, token_] = await Promise.all([
        adminService.getAdminActive(decoded.admin_id),
        adminTokensService.findOneByAdminId({ admin_id: decoded.admin_id })
      ])

      if (!admin || !token_) {
        throw new UnauthorizedError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }

      req.admin = admin
    }

    req.decoded_authorization = decoded
    next()
  } catch (error) {
    next(new UnauthorizedError(error as string))
  }
}
