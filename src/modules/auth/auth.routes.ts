import { Router } from 'express'
import { loginRateLimit } from '~/middlewares/ratelimit.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
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

authRoute.post('/signup', bodyValidate(RegisterUserDtoSchema), asyncHandler(AuthController.signup))

authRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  bodyValidate(LoginAuthDtoSchema),
  asyncHandler(AuthController.login)
)

authRoute.get('/google-login', asyncHandler(AuthController.googleLogin))

authRoute.get('/facebook-login', asyncHandler(AuthController.facebookLogin))

authRoute.post('/refresh-token', asyncHandler(AuthController.refreshToken))

authRoute.post('/forgot-password', bodyValidate(ForgotPasswordDtoSchema), asyncHandler(AuthController.forgotPassword))

authRoute.post(
  '/reset-password',
  bodyValidate(ResetPasswordDtoSchema),
  verifyTokenForgotPasswordMiddleware,
  asyncHandler(AuthController.resetPassword)
)

authRoute.post('/logout', authenticationMiddleware, verifyRefreshTokenMiddleware, asyncHandler(AuthController.logout))

authRoute
  .route('/me')
  .get(authenticationMiddleware, asyncHandler(AuthController.getMeUser))
  .patch(authenticationMiddleware, bodyValidate(UpdateMeDtoSchema), asyncHandler(AuthController.updateMeUser))

export default authRoute
