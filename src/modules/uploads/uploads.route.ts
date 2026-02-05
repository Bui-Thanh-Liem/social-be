import { Router } from 'express'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import UploadsControllers from '~/modules/uploads/uploads.controller'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { deleteMediaDtoSchema, presignedUrlDtoSchema, uploadConfirmDtoSchema } from '~/modules/uploads/uploads.dto'

const uploadsRoute = Router()

uploadsRoute.use(verifyAccessToken, verifyUserEmail)

//
uploadsRoute.post(
  '/presigned-url',
  requestBodyValidate(presignedUrlDtoSchema),
  asyncHandler(UploadsControllers.presignedURL)
)

//
uploadsRoute.post(
  '/confirm',
  requestBodyValidate(uploadConfirmDtoSchema),
  asyncHandler(UploadsControllers.confirmUpload)
)

//
uploadsRoute.delete('/', requestBodyValidate(deleteMediaDtoSchema), asyncHandler(UploadsControllers.delete))

export default uploadsRoute
