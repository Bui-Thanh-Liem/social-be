import { Router } from 'express'
import authController from '~/controllers/auth.controller'
import {
  ForgotPasswordDtoSchema,
  LoginAuthDtoSchema,
  RegisterUserDtoSchema,
  ResetPasswordDtoSchema,
  UpdateMeDtoSchema
} from '~/dtos/auth.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { loginRateLimit } from '~/middlewares/ratelimit.middleware'
import { verifyRefreshTokenMiddleware } from '~/middlewares/user/verify-refresh-token.middleware'
import { verifyTokenForgotPasswordMiddleware } from '~/middlewares/user/verify-token-forgot-password.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const authRoute = Router()

// Signup
authRoute.post('/signup', bodyValidate(RegisterUserDtoSchema), asyncHandler(authController.signup))

// Login
authRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  bodyValidate(LoginAuthDtoSchema),
  asyncHandler(authController.login)
)

// Google login
authRoute.get('/google-login', asyncHandler(authController.googleLogin))

// Facebook login
authRoute.get('/facebook-login', asyncHandler(authController.facebookLogin))

// Refresh token
authRoute.post('/refresh-token', asyncHandler(authController.refreshToken))

// Forgot password
authRoute.post('/forgot-password', bodyValidate(ForgotPasswordDtoSchema), asyncHandler(authController.forgotPassword))

// Reset password
authRoute.post(
  '/reset-password',
  bodyValidate(ResetPasswordDtoSchema),
  verifyTokenForgotPasswordMiddleware,
  asyncHandler(authController.resetPassword)
)

// Các route dưới đây cần authentication
authRoute.use(authenticationMiddleware)

// Logout
authRoute.post('/logout', verifyRefreshTokenMiddleware, asyncHandler(authController.logout))

// GetMe & UpdateMe
authRoute
  .route('/me')
  .get(asyncHandler(authController.getMeUser))
  .patch(bodyValidate(UpdateMeDtoSchema), asyncHandler(authController.updateMeUser))

export default authRoute
