import { Router } from 'express'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import usersController from '~/controllers/public/users.controller'

const privateUsersRoute = Router()

privateUsersRoute.use(authenticationAdminMiddleware)

privateUsersRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(usersController.adminGetUsers))

export default privateUsersRoute
