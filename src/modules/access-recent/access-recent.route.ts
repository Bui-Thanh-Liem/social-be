import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { bodyValidate } from '~/utils/body-validate.middleware'
import accessRecentController from './access-recent.controller'
import { CreateAccessRecentDtoSchema } from './access-recent.dto'

const accessRecentRoute = Router()

// Tất cả route của access-recent đều cần authentication
accessRecentRoute.use(authenticationMiddleware)

// CRUD bad-words
accessRecentRoute
  .route('/')
  .post(bodyValidate(CreateAccessRecentDtoSchema), asyncHandler(accessRecentController.create))

export default accessRecentRoute
