import { Router } from 'express'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { verifyAccessTokenAdmin } from '~/shared/middlewares/admin/verify-access-token-admin.middleware'
import { loginRateLimit } from '~/shared/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import AdminController from './admin.controller'
import { LoginAdminDtoSchema } from './admin.dto'

const adminRoute = Router()

adminRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  requestBodyValidate(LoginAdminDtoSchema),
  asyncHandler(AdminController.login)
)

/**
 * BƯỚC 1: KÍCH HOẠT 2FA
 * API tạo Secret Key và trả về mã QR
 */
adminRoute.route('/2fa/setup/:admin_id').post(asyncHandler(AdminController.setupTwoFactorAuth))

/**
 * BƯỚC 2: XÁC THỰC LẦN ĐẦU (Kích hoạt chính thức)
 * ADmin quét QR xong phải nhập thử mã để xác nhận thiết lập thành công
 */
adminRoute.route('/2fa/active/:admin_id').post(asyncHandler(AdminController.activeTwoFactorAuth))

/**
 * BƯỚC 3: KIỂM TRA ĐĂNG NHẬP
 * Sử dụng mỗi khi người dùng đăng nhập sau này
 */
adminRoute.route('/2fa/verify/:admin_id').post(asyncHandler(AdminController.verifyTwoFactorAuth))

//
adminRoute.use(verifyAccessTokenAdmin)

//
adminRoute.post('/logout', asyncHandler(AdminController.logout))

//
adminRoute.route('/me').get(asyncHandler(AdminController.geMe))

//
adminRoute.get('/users', requestQueryValidate(QueryDtoSchema), asyncHandler(AdminController.adminGetUsers))

//
adminRoute.get('/tweets', requestQueryValidate(QueryDtoSchema), asyncHandler(AdminController.adminGetTweets))

//
adminRoute.get('/communities', requestQueryValidate(QueryDtoSchema), asyncHandler(AdminController.adminGetCommunities))

//
adminRoute.get('/media', requestQueryValidate(QueryDtoSchema), asyncHandler(AdminController.adminGetMedia))

export default adminRoute
