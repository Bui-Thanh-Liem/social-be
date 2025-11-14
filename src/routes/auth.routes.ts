import { Router } from 'express'
import AuthController from '~/controllers/Auth.controller'
import { loginRateLimit } from '~/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyRefreshToken } from '~/middlewares/verify-refresh-token.middleware'
import { verifyTokenForgotPassword } from '~/middlewares/verify-token-forgot-password.middleware'
import {
  ForgotPasswordDtoSchema,
  LoginUserDtoSchema,
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
  requestBodyValidate(LoginUserDtoSchema),
  asyncHandler(AuthController.login)
)

authRoute.get('/google-login', asyncHandler(AuthController.googleLogin))

authRoute.get('/facebook-login', asyncHandler(AuthController.facebookLogin))

authRoute.post('/logout', verifyAccessToken, verifyRefreshToken, asyncHandler(AuthController.logout))

authRoute.post('/refresh-token', verifyRefreshToken, asyncHandler(AuthController.refreshToken))

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

authRoute
  .route('/me')
  .get(verifyAccessToken, asyncHandler(AuthController.getMe))
  .patch(verifyAccessToken, requestBodyValidate(UpdateMeDtoSchema), asyncHandler(AuthController.updateMe))

export default authRoute
