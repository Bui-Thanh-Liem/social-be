import { Router } from 'express'
import UsersControllers from '~/controllers/Users.controller'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyTokenVerifyEmail } from '~/middlewares/verifyTokenVerifyEmail.middleware'
import { verifyUserActiveForChangePassword } from '~/middlewares/verifyUserActiveForChangePassword.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { ChangePasswordDtoSchema, verifyEmailDtoSchema } from '~/shared/dtos/req/user.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const usersRoute = Router()

usersRoute.post(
  '/verify-email',
  verifyAccessToken,
  requestBodyValidate(verifyEmailDtoSchema),
  verifyTokenVerifyEmail,
  wrapAsyncHandler(UsersControllers.verifyEmail)
)

usersRoute.post('/resend-verify-email', verifyAccessToken, wrapAsyncHandler(UsersControllers.resendVerifyEmail))

usersRoute.get('/username/:username', verifyAccessToken, wrapAsyncHandler(UsersControllers.getOneByUsername))
usersRoute.get('/mentions/:username', verifyAccessToken, wrapAsyncHandler(UsersControllers.getMultiForMentions))

usersRoute.get(
  '/followed',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(UsersControllers.getFollowedUsersBasic)
)

usersRoute.get(
  '/top-followed',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(UsersControllers.getTopFollowedUsers)
)

usersRoute.post(
  '/change-password',
  verifyAccessToken,
  requestBodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePassword,
  wrapAsyncHandler(UsersControllers.changePassword)
)

export default usersRoute
