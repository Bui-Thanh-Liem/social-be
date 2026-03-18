import { Router } from 'express'
import UsersController from '~/modules/users/users.controller'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/modules/users/users.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { resendRateLimit } from '~/middlewares/ratelimit.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { verifyUserActiveForChangePasswordMiddleware } from '~/middlewares/user/verify-user-active-for-change-password.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { optionLogin } from '~/middlewares/option-login.middleware'

const usersRoute = Router()

// Lấy thông tin user theo username (dùng cho profile, mentions)
usersRoute.get(
  '/username/:username',
  optionLogin(authenticationMiddleware),
  asyncHandler(UsersController.getOneByUsername)
)

// Lấy thông tin user có nhiều người theo dõi nhất (dùng cho phần gợi ý người dùng)
usersRoute.get(
  '/top-followed',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getTopFollowedUsers)
)

// Các route dưới đây cần authentication
usersRoute.use(authenticationMiddleware)

// Xác thực email sau khi đăng ký
usersRoute.post('/verify-email', bodyValidate(VerifyEmailDtoSchema), asyncHandler(UsersController.verifyEmail))

// Gửi lại email xác thực
usersRoute.post('/resend-verify-email', asyncHandler(resendRateLimit), asyncHandler(UsersController.resendVerifyEmail))

// Lấy danh sách user để mention (dùng cho phần gợi ý mention khi người dùng nhập @)
usersRoute.get('/mentions/:username', asyncHandler(UsersController.getMultiForMentions))

// Lấy danh sách người theo dõi của một user
usersRoute.get(
  '/followed/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getFollowedUsersBasic)
)

// Lấy danh sách người mà một user đang theo dõi
usersRoute.get(
  '/following/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(UsersController.getFollowingUsersBasic)
)

// Đổi mật khẩu
usersRoute.post(
  '/change-password',
  bodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePasswordMiddleware,
  asyncHandler(UsersController.changePassword)
)

export default usersRoute
