import { Router } from 'express'
import usersController from '~/controllers/users.controller'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/dtos/users.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { resendRateLimit } from '~/middlewares/ratelimit.middleware'
import { verifyUserActiveForChangePasswordMiddleware } from '~/middlewares/user/verify-user-active-for-change-password.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const usersRoute = Router()

// Lấy thông tin user theo username (dùng cho profile, mentions)
usersRoute.get(
  '/username/:username',
  optionLogin(authenticationMiddleware),
  asyncHandler(usersController.getOneByUsername)
)

// Lấy thông tin user có nhiều người theo dõi nhất (dùng cho phần gợi ý người dùng)
usersRoute.get(
  '/top-followed',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(usersController.getTopFollowedUsers)
)

// Các route dưới đây cần authentication
usersRoute.use(authenticationMiddleware)

// Xác thực email sau khi đăng ký
usersRoute.post('/verify-email', bodyValidate(VerifyEmailDtoSchema), asyncHandler(usersController.verifyEmail))

// Gửi lại email xác thực
usersRoute.post('/resend-verify-email', asyncHandler(resendRateLimit), asyncHandler(usersController.resendVerifyEmail))

// Lấy danh sách user để mention (dùng cho phần gợi ý mention khi người dùng nhập @)
usersRoute.get('/mentions/:username', asyncHandler(usersController.getMultiForMentions))

// Lấy danh sách người theo dõi của một user
usersRoute.get(
  '/followed/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(usersController.getFollowedUsersBasic)
)

// Lấy danh sách người mà một user đang theo dõi
usersRoute.get(
  '/following/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(usersController.getFollowingUsersBasic)
)

// Đổi mật khẩu
usersRoute.post(
  '/change-password',
  bodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePasswordMiddleware,
  asyncHandler(usersController.changePassword)
)

export default usersRoute
