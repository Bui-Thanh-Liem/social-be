import { Router } from 'express'
import UsersController from '~/modules/users/users.controller'
import { resendRateLimit } from '~/shared/middlewares/ratelimit.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserActiveForChangePassword } from '~/shared/middlewares/user/verify-user-active-for-change-password.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/modules/users/users.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const usersRoute = Router()

usersRoute.use(verifyAccessToken)

usersRoute.post('/verify-email', requestBodyValidate(VerifyEmailDtoSchema), asyncHandler(UsersController.verifyEmail))

usersRoute.post('/resend-verify-email', asyncHandler(resendRateLimit), asyncHandler(UsersController.resendVerifyEmail))

usersRoute.get('/username/:username', asyncHandler(UsersController.getOneByUsername))
usersRoute.get('/mentions/:username', asyncHandler(UsersController.getMultiForMentions))

usersRoute.get(
  '/followed/:user_id',
  requestParamsValidate(UserIdDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getFollowedUsersBasic)
)

usersRoute.get(
  '/following/:user_id',
  requestParamsValidate(UserIdDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getFollowingUsersBasic)
)

usersRoute.get(
  '/top-followed',
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getTopFollowedUsers)
)

usersRoute.post(
  '/change-password',
  requestBodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePassword,
  asyncHandler(UsersController.changePassword)
)

export default usersRoute
