import { Router } from 'express'
import authController from '~/controllers/public/auth-user.controller'
import {
  ForgotPasswordUserDtoSchema,
  LoginUserDtoSchema,
  RegisterUserDtoSchema,
  ResetPasswordUserDtoSchema,
  UpdateMeUserDtoSchema
} from '~/shared/dtos/public/auth-user.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { loginRateLimit } from '~/middlewares/common/ratelimit.middleware'
import { verifyRefreshTokenMiddleware } from '~/middlewares/public/user/verify-refresh-token.middleware'
import { verifyTokenForgotPasswordMiddleware } from '~/middlewares/public/user/verify-token-forgot-password.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module AuthUserRoutes
 * @description Quản lý các API liên quan đến xác thực và quản lý người dùng như đăng ký, đăng nhập, lấy thông tin người dùng, v.v.
 */
const authUserRoute = Router()

/**
 * @description API để đăng ký người dùng mới.
 * @method POST
 * @route /api/auth/signup
 * @access Public
 */
authUserRoute.post('/signup', bodyValidate(RegisterUserDtoSchema), asyncHandler(authController.signup))

/**
 * @description API để đăng nhập người dùng.
 * @method POST
 * @route /api/auth/login
 * @access Public
 */
authUserRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  bodyValidate(LoginUserDtoSchema),
  asyncHandler(authController.login)
)

/**
 * @description API để đăng nhập bằng Google.
 * @method GET
 * @route /api/auth/google-login
 * @access Public
 */
authUserRoute.get('/google-login', asyncHandler(authController.googleLogin))

/**
 * @description API để đăng nhập bằng Facebook.
 * @method GET
 * @route /api/auth/facebook-login
 * @access Public
 */
authUserRoute.get('/facebook-login', asyncHandler(authController.facebookLogin))

/**
 * @description API để làm mới token truy cập (access token) khi token cũ đã hết hạn.
 * @method POST
 * @route /api/auth/refresh-token
 * @access Public
 */
authUserRoute.post('/refresh-token', asyncHandler(authController.refreshToken))

/**
 * @description API để gửi email đặt lại mật khẩu khi người dùng quên mật khẩu.
 * @method POST
 * @route /api/auth/forgot-password
 * @access Public
 */
authUserRoute.post(
  '/forgot-password',
  bodyValidate(ForgotPasswordUserDtoSchema),
  asyncHandler(authController.forgotPassword)
)

/**
 * @description API để đặt lại mật khẩu khi người dùng quên mật khẩu.
 * @method POST
 * @route /api/auth/reset-password
 * @access Public
 */
authUserRoute.post(
  '/reset-password',
  bodyValidate(ResetPasswordUserDtoSchema),
  verifyTokenForgotPasswordMiddleware,
  asyncHandler(authController.resetPassword)
)

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
authUserRoute.use(authenticationUserMiddleware)

/**
 * @description API để đăng xuất người dùng.
 * @method POST
 * @route /api/auth/logout
 * @access Private
 */
authUserRoute.post('/logout', verifyRefreshTokenMiddleware, asyncHandler(authController.logout))

authUserRoute
  .route('/me')

  /**
   * @description API để lấy thông tin người dùng hiện tại.
   * @method GET
   * @route /api/auth/me
   * @access Private
   */
  .get(asyncHandler(authController.getMeUser))

  /**
   * @description API để cập nhật thông tin người dùng hiện tại.
   * @method PATCH
   * @route /api/auth/me
   * @access Private
   */
  .patch(bodyValidate(UpdateMeUserDtoSchema), asyncHandler(authController.updateMeUser))

export default authUserRoute
