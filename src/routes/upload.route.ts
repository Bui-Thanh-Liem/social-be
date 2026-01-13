import { Router } from 'express'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import UploadsControllers from '~/controllers/Upload.controller'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { deleteMediaDtoSchema, presignedUrlDtoSchema, uploadConfirmDtoSchema } from '~/shared/dtos/req/upload.dto'

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
