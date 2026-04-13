import { Router } from 'express'
import mediaController from '~/controllers/private/medias.controller'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const privateMediaRoute = Router()

privateMediaRoute.use(authenticationAdminMiddleware)

privateMediaRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(mediaController.getMedias))

export default privateMediaRoute
