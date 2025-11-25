import { Router } from 'express'
import UploadsControllers from '~/controllers/Uploads.controller'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { remoteImagesDtoSchema } from '~/shared/dtos/req/upload.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const uploadsRoute = Router()

uploadsRoute.use(verifyAccessToken, verifyUserEmail)

//
uploadsRoute.post('/images', asyncHandler(UploadsControllers.uploadImages))

//
uploadsRoute.post('/videos', asyncHandler(UploadsControllers.uploadVideos))

//
uploadsRoute.post('/cloudinary', asyncHandler(UploadsControllers.uploadToCloudinary))

//
uploadsRoute.delete('/cloudinary', asyncHandler(UploadsControllers.deleteFromCloudinary))

//
uploadsRoute.delete(
  '/images',
  requestBodyValidate(remoteImagesDtoSchema),
  asyncHandler(UploadsControllers.removeImages)
)

export default uploadsRoute
