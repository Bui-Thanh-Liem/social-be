import { Router } from 'express'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import usersController from '~/controllers/public/users.controller'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { adminChangeUserStatusDtoSchema, adminRemindUserDtoSchema } from '~/shared/dtos/private/user.dto'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'

const privateUsersRoute = Router()

privateUsersRoute.use(authenticationAdminMiddleware)

privateUsersRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(usersController.adminGetUsers))

privateUsersRoute.patch(
  '/change-status/:id',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(adminChangeUserStatusDtoSchema),
  asyncHandler(usersController.adminChangeUserStatus)
)

privateUsersRoute.patch(
  '/remind/:id',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(adminRemindUserDtoSchema),
  asyncHandler(usersController.adminRemindUser)
)

export default privateUsersRoute
