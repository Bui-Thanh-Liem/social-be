import { Router } from 'express'
import { verifyAccessTokenAdmin } from '~/shared/middlewares/admin/verify-access-token-admin.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import userViolationsController from './user-violations.controller'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'

const userViolationsRoute = Router()

userViolationsRoute.use(verifyAccessTokenAdmin)

userViolationsRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(userViolationsController.getMulti))

export default userViolationsRoute
