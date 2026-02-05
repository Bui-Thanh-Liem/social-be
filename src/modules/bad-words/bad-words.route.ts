import { Router } from 'express'
import { verifyAccessTokenAdmin } from '~/shared/middlewares/admin/verify-access-token-admin.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { CreateBadWordDtoSchema } from './bad-words.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import BadWordController from './bad-words.controller'

const badWordRoute = Router()

badWordRoute.use(verifyAccessTokenAdmin)

badWordRoute.post('/', requestBodyValidate(CreateBadWordDtoSchema), asyncHandler(BadWordController.create))

export default badWordRoute
