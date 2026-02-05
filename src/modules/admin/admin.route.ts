import { Router } from 'express'
import { LoginAuthDtoSchema } from '~/shared/dtos/req/auth.dto'
import { loginRateLimit } from '~/shared/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import AdminController from './admin.controller'
import { verifyAccessTokenAdmin } from '~/shared/middlewares/admin/verify-access-token-admin.middleware'

const adminRoute = Router()

adminRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  requestBodyValidate(LoginAuthDtoSchema),
  asyncHandler(AdminController.login)
)

//
adminRoute.use(verifyAccessTokenAdmin)

//
adminRoute.route('/me').get(asyncHandler(AdminController.geMe))

//
adminRoute.get('/users', asyncHandler(AdminController.adminGetUsers))

//
adminRoute.get('/tweets', asyncHandler(AdminController.adminGetTweets))

//
adminRoute.get('/communities', asyncHandler(AdminController.adminGetCommunities))

//
adminRoute.get('/media', asyncHandler(AdminController.adminGetMedia))

export default adminRoute
