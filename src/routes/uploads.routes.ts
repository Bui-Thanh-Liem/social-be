import { Router } from 'express'
import UploadsControllers from '~/controllers/Uploads.controller'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { remoteImagesDtoSchema } from '~/shared/dtos/req/upload.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const uploadsRoute = Router()

uploadsRoute.post('/images', verifyAccessToken, verifyUserEmail, asyncHandler(UploadsControllers.uploadImages))

uploadsRoute.post('/videos', verifyAccessToken, verifyUserEmail, asyncHandler(UploadsControllers.uploadVideos))

uploadsRoute.delete(
  '/remove/images',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(remoteImagesDtoSchema),
  asyncHandler(UploadsControllers.removeImages)
)

export default uploadsRoute
