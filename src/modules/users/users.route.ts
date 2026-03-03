import { Router } from 'express'
import UsersController from '~/modules/users/users.controller'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/modules/users/users.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { resendRateLimit } from '~/shared/middlewares/ratelimit.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserActiveForChangePasswordMiddleware } from '~/shared/middlewares/user/verify-user-active-for-change-password.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const usersRoute = Router()

usersRoute.use(authenticationMiddleware)

usersRoute.post('/verify-email', bodyValidate(VerifyEmailDtoSchema), asyncHandler(UsersController.verifyEmail))

usersRoute.post('/resend-verify-email', asyncHandler(resendRateLimit), asyncHandler(UsersController.resendVerifyEmail))

usersRoute.get('/username/:username', asyncHandler(UsersController.getOneByUsername))
usersRoute.get('/mentions/:username', asyncHandler(UsersController.getMultiForMentions))

usersRoute.get(
  '/followed/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getFollowedUsersBasic)
)

usersRoute.get(
  '/following/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getFollowingUsersBasic)
)

usersRoute.get(
  '/top-followed',
  verifyUserEmailMiddleware,
  queryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getTopFollowedUsers)
)

usersRoute.post(
  '/change-password',
  bodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePasswordMiddleware,
  asyncHandler(UsersController.changePassword)
)

export default usersRoute
