import { Router } from 'express'
import AuthController from '~/controllers/Auth.controller'
import {
  ForgotPasswordDtoSchema,
  LoginUserDtoSchema,
  RegisterUserDtoSchema,
  ResetPasswordDtoSchema
} from '~/shared/dtos/req/auth.dto'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyRefreshToken } from '~/middlewares/verifyRefreshToken.middleware'
import { verifyTokenForgotPassword } from '~/middlewares/verifyTokenForgotPassword.middleware'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'
import { UpdateMeDtoSchema } from '~/shared/dtos/req/user.dto'

const authRoute = Router()

authRoute.post('/register', requestBodyValidate(RegisterUserDtoSchema), wrapAsyncHandler(AuthController.register))

authRoute.post('/login', requestBodyValidate(LoginUserDtoSchema), AuthController.login)

authRoute.get('/google-login', AuthController.googleLogin)

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
  .get(verifyAccessToken, verifyRefreshToken, wrapAsyncHandler(AuthController.getMe))
  .patch(verifyAccessToken, requestBodyValidate(UpdateMeDtoSchema), wrapAsyncHandler(AuthController.updateMe))

export default authRoute
