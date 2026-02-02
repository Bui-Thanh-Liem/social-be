import { Router } from 'express'
import UsersControllers from '~/controllers/Users.controller'
import { resendRateLimit } from '~/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserActiveForChangePassword } from '~/middlewares/user/verify-user-active-for-change-password.middleware'
import { verifyUserEmail } from '~/middlewares/user/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/shared/dtos/req/user.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const usersRoute = Router()

usersRoute.use(verifyAccessToken)

usersRoute.post('/verify-email', requestBodyValidate(VerifyEmailDtoSchema), asyncHandler(UsersControllers.verifyEmail))

usersRoute.post('/resend-verify-email', asyncHandler(resendRateLimit), asyncHandler(UsersControllers.resendVerifyEmail))

usersRoute.get('/username/:username', asyncHandler(UsersControllers.getOneByUsername))
usersRoute.get('/mentions/:username', asyncHandler(UsersControllers.getMultiForMentions))

usersRoute.get(
  '/followed/:user_id',
  requestParamsValidate(UserIdDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(UsersControllers.getFollowedUsersBasic)
)

usersRoute.get(
  '/following/:user_id',
  requestParamsValidate(UserIdDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(UsersControllers.getFollowingUsersBasic)
)

usersRoute.get(
  '/top-followed',
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(UsersControllers.getTopFollowedUsers)
)

usersRoute.post(
  '/change-password',
  requestBodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePassword,
  asyncHandler(UsersControllers.changePassword)
)

export default usersRoute
