import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.util'
import { bodyValidate } from '../../middlewares/common/body-validate.middleware'
import { LoginAdminDtoSchema } from '~/dtos/private/auth-admin.dto'
import { loginRateLimit, setupF2aRateLimit, verifyF2aRateLimit } from '~/middlewares/common/ratelimit.middleware'
import authAdminController from '~/controllers/private/auth-admin.controller'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'

const authAdminRoute = Router()

/**
 * ĐĂNG NHẬP
 * Nếu chưa thiết lập 2FA sẽ yêu cầu setup, nếu đã thiết lập nhưng chưa active sẽ yêu cầu active, nếu đã thiết lập và active sẽ yêu cầu verify 2FA
 */
authAdminRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  bodyValidate(LoginAdminDtoSchema),
  asyncHandler(authAdminController.login)
)

/**
 * KÍCH HOẠT 2FA
 * API tạo Secret Key và trả về mã QR
 */
authAdminRoute
  .route('/2fa/setup/:admin_id')
  .post(asyncHandler(setupF2aRateLimit), asyncHandler(authAdminController.setupTwoFactorAuth))

/**
 * XÁC THỰC LẦN ĐẦU (Kích hoạt chính thức)
 * ADmin quét QR xong phải nhập thử mã để xác nhận thiết lập thành công
 */
authAdminRoute
  .route('/2fa/active/:admin_id')
  .post(asyncHandler(verifyF2aRateLimit), asyncHandler(authAdminController.activeTwoFactorAuth))

/**
 * KIỂM TRA ĐĂNG NHẬP
 * Sử dụng mỗi khi người dùng đăng nhập sau này
 */
authAdminRoute
  .route('/2fa/verify/:admin_id')
  .post(asyncHandler(verifyF2aRateLimit), asyncHandler(authAdminController.verifyTwoFactorAuth))

//
authAdminRoute.use(authenticationAdminMiddleware)

/**
 * ĐĂNG XUẤT
 * Xóa token khỏi database để kết thúc phiên làm việc
 * Xóa cache liên quan đến token đó để đảm bảo token không còn hiệu lực nữa
 */
authAdminRoute.post('/logout', asyncHandler(authAdminController.logout))

/**
 * LẤY THÔNG TIN CỦA CHÍNH MÌNH
 */
authAdminRoute.route('/me').get(asyncHandler(authAdminController.getMe))

export default authAdminRoute
