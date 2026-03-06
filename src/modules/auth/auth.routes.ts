import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { loginRateLimit } from '~/middlewares/ratelimit.middleware'
import { verifyRefreshTokenMiddleware } from '~/middlewares/user/verify-refresh-token.middleware'
import { verifyTokenForgotPasswordMiddleware } from '~/middlewares/user/verify-token-forgot-password.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { bodyValidate } from '~/utils/body-validate.middleware'
import AuthController from './auth.controller'
import {
  ForgotPasswordDtoSchema,
  LoginAuthDtoSchema,
  RegisterUserDtoSchema,
  ResetPasswordDtoSchema,
  UpdateMeDtoSchema
} from './auth.dto'

const authRoute = Router()

// Signup
authRoute.post('/signup', bodyValidate(RegisterUserDtoSchema), asyncHandler(AuthController.signup))

// Login
authRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  bodyValidate(LoginAuthDtoSchema),
  asyncHandler(AuthController.login)
)

// Google login
authRoute.get('/google-login', asyncHandler(AuthController.googleLogin))

// Facebook login
authRoute.get('/facebook-login', asyncHandler(AuthController.facebookLogin))

// Refresh token
authRoute.post('/refresh-token', asyncHandler(AuthController.refreshToken))

// Forgot password
authRoute.post('/forgot-password', bodyValidate(ForgotPasswordDtoSchema), asyncHandler(AuthController.forgotPassword))

// Reset password
authRoute.post(
  '/reset-password',
  bodyValidate(ResetPasswordDtoSchema),
  verifyTokenForgotPasswordMiddleware,
  asyncHandler(AuthController.resetPassword)
)

// Các route dưới đây cần authentication
authRoute.use(authenticationMiddleware)

// Logout
authRoute.post('/logout', verifyRefreshTokenMiddleware, asyncHandler(AuthController.logout))

// GetMe & UpdateMe
authRoute
  .route('/me')
  .get(asyncHandler(AuthController.getMeUser))
  .patch(bodyValidate(UpdateMeDtoSchema), asyncHandler(AuthController.updateMeUser))

export default authRoute
