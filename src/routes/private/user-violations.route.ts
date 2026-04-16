import { Router } from 'express'
import userViolationsController from '~/controllers/private/user-violations.controller'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const userViolationsRoute = Router()

userViolationsRoute.use(authenticationAdminMiddleware)

userViolationsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(userViolationsController.getMulti))

export default userViolationsRoute
