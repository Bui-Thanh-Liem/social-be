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
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const authRoute = Router()

authRoute.post('/register', requestBodyValidate(RegisterUserDtoSchema), wrapAsyncHandler(AuthController.register))

authRoute.post(
  '/login',
  wrapAsyncHandler(loginRateLimit),
  requestBodyValidate(LoginUserDtoSchema),
  wrapAsyncHandler(AuthController.login)
)

authRoute.get('/google-login', AuthController.googleLogin)

authRoute.get('/facebook-login', AuthController.facebookLogin)

authRoute.post('/logout', verifyAccessToken, verifyRefreshToken, wrapAsyncHandler(AuthController.logout))

authRoute.post('/refresh-token', verifyRefreshToken, wrapAsyncHandler(AuthController.refreshToken))

authRoute.post(
  '/forgot-password',
  requestBodyValidate(ForgotPasswordDtoSchema),
  wrapAsyncHandler(AuthController.forgotPassword)
)

authRoute.post(
  '/reset-password',
  requestBodyValidate(ResetPasswordDtoSchema),
  verifyTokenForgotPassword,
  wrapAsyncHandler(AuthController.resetPassword)
)

authRoute
  .route('/me')
  .get(verifyAccessToken, wrapAsyncHandler(AuthController.getMe))
  .patch(verifyAccessToken, requestBodyValidate(UpdateMeDtoSchema), wrapAsyncHandler(AuthController.updateMe))

export default authRoute
