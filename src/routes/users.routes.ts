import { Router } from 'express'
import UsersControllers from '~/controllers/Users.controller'
import { resendRateLimit } from '~/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyTokenVerifyEmail } from '~/middlewares/verify-token-verify-email.middleware'
import { verifyUserActiveForChangePassword } from '~/middlewares/verify-user-active-for-change-password.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/shared/dtos/req/user.dto'
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const usersRoute = Router()

usersRoute.post(
  '/verify-email',
  verifyAccessToken,
  requestBodyValidate(VerifyEmailDtoSchema),
  verifyTokenVerifyEmail,
  wrapAsyncHandler(UsersControllers.verifyEmail)
)

usersRoute.post(
  '/resend-verify-email',
  wrapAsyncHandler(resendRateLimit),
  verifyAccessToken,
  wrapAsyncHandler(UsersControllers.resendVerifyEmail)
)

usersRoute.get('/username/:username', verifyAccessToken, wrapAsyncHandler(UsersControllers.getOneByUsername))
usersRoute.get('/mentions/:username', verifyAccessToken, wrapAsyncHandler(UsersControllers.getMultiForMentions))

usersRoute.get(
  '/followed/:user_id',
  verifyAccessToken,
  requestParamsValidate(UserIdDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(UsersControllers.getFollowedUsersBasic)
)

usersRoute.get(
  '/following/:user_id',
  verifyAccessToken,
  requestParamsValidate(UserIdDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(UsersControllers.getFollowingUsersBasic)
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
