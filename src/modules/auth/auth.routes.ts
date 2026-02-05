import { Router } from 'express'
import AuthController from '~/modules/auth/auth.controller'
import { loginRateLimit } from '~/shared/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyRefreshToken } from '~/shared/middlewares/user/verify-refresh-token.middleware'
import { verifyTokenForgotPassword } from '~/shared/middlewares/user/verify-token-forgot-password.middleware'
import {
  ForgotPasswordDtoSchema,
  LoginAuthDtoSchema,
  RegisterUserDtoSchema,
  ResetPasswordDtoSchema,
  UpdateMeDtoSchema
} from '~/shared/dtos/req/auth.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const authRoute = Router()

authRoute.post('/signup', requestBodyValidate(RegisterUserDtoSchema), asyncHandler(AuthController.signup))

authRoute.post(
  '/login',
  asyncHandler(loginRateLimit),
  requestBodyValidate(LoginAuthDtoSchema),
  asyncHandler(AuthController.login)
)

authRoute.get('/google-login', asyncHandler(AuthController.googleLogin))

authRoute.get('/facebook-login', asyncHandler(AuthController.facebookLogin))

authRoute.post('/refresh-token', asyncHandler(AuthController.refreshToken))

authRoute.post(
  '/forgot-password',
  requestBodyValidate(ForgotPasswordDtoSchema),
  asyncHandler(AuthController.forgotPassword)
)

authRoute.post(
  '/reset-password',
  requestBodyValidate(ResetPasswordDtoSchema),
  verifyTokenForgotPassword,
  asyncHandler(AuthController.resetPassword)
)

authRoute.post('/logout', verifyAccessToken, verifyRefreshToken, asyncHandler(AuthController.logout))

authRoute
  .route('/me')
  .get(verifyAccessToken, asyncHandler(AuthController.getMeUser))
  .patch(verifyAccessToken, requestBodyValidate(UpdateMeDtoSchema), asyncHandler(AuthController.updateMeUser))

export default authRoute
