import { Router } from 'express'
import usersController from '~/controllers/public/users.controller'
import { ChangePasswordDtoSchema, UserIdDtoSchema, VerifyEmailDtoSchema } from '~/dtos/public/users.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { resendRateLimit } from '~/middlewares/ratelimit.middleware'
import { verifyUserActiveForChangePasswordMiddleware } from '~/middlewares/user/verify-user-active-for-change-password.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module UsersRoutes
 * @description Quản lý các API liên quan đến người dùng, bao gồm lấy thông tin người dùng theo username, lấy danh sách người dùng được theo dõi nhiều nhất, xác thực email sau khi đăng ký, gửi lại email xác thực, lấy danh sách user để mention, lấy danh sách người theo dõi và người đang theo dõi của một user, đổi mật khẩu, v.v.
 */

const usersRoute = Router()

/**
 * @description API lấy thông tin user theo username (dùng cho profile, mentions)
 * @method GET
 * @route /api/users/username/:username
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
usersRoute.get(
  '/username/:username',
  optionLogin(authenticationUserMiddleware),
  asyncHandler(usersController.getOneByUsername)
)

/**
 * @description API để lấy danh sách người dùng có nhiều người theo dõi nhất (dùng cho phần gợi ý người dùng)
 * @method GET
 * @route /api/users/top-followed
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
usersRoute.get(
  '/top-followed',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(usersController.getTopFollowedUsers)
)

/**
 * @description API để lấy danh sách người dùng khách (dùng cho phần gợi ý người dùng khách khi đăng nhập bằng tài khoản khách)
 * @method GET
 * @route /api/users/guests
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
usersRoute.get('/guests', asyncHandler(usersController.getGuestUsers))

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
usersRoute.use(authenticationUserMiddleware)

/**
 * @description API để xác thực email sau khi người dùng đăng ký. Người dùng sẽ nhận được một token xác thực qua email, và họ sẽ gửi token đó đến API này để xác nhận rằng email của họ là hợp lệ.
 * @method POST
 * @route /api/users/verify-email
 * @access Private
 */
usersRoute.post('/verify-email', bodyValidate(VerifyEmailDtoSchema), asyncHandler(usersController.verifyEmail))

/**
 * @description API để gửi lại email xác thực cho người dùng. Nếu người dùng đã đăng ký nhưng chưa nhận được email xác thực hoặc email đã hết hạn, họ có thể sử dụng API này để yêu cầu gửi lại email xác thực.
 * @method POST
 * @route /api/users/resend-verify-email
 * @access Private
 */
usersRoute.post('/resend-verify-email', asyncHandler(resendRateLimit), asyncHandler(usersController.resendVerifyEmail))

/**
 * @description API để lấy danh sách người dùng có thể mention (dùng cho phần gợi ý mention khi người dùng nhập @)
 * @method GET
 * @route /api/users/mentions/:username
 * @access Private
 */
usersRoute.get('/mentions/:username', asyncHandler(usersController.getMultiForMentions))

/**
 * @description API để lấy danh sách người theo dõi của một user
 * @method GET
 * @route /api/users/followed/:user_id
 * @access Private
 */
usersRoute.get(
  '/followed/:user_id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(usersController.getFollowedUsersBasic)
)

/**
 * @description API để lấy danh sách người mà một user đang theo dõi
 * @method GET
 * @route /api/users/following/:id
 * @access Private
 */
usersRoute.get(
  '/following/:id',
  paramsValidate(UserIdDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(usersController.getFollowingUsersBasic)
)

/**
 * @description API để đổi mật khẩu
 * @method POST
 * @route /api/users/change-password
 * @access Private
 */
usersRoute.post(
  '/change-password',
  bodyValidate(ChangePasswordDtoSchema),
  verifyUserActiveForChangePasswordMiddleware,
  asyncHandler(usersController.changePassword)
)

export default usersRoute
