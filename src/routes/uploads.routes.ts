import { Router } from 'express'
import UploadsControllers from '~/controllers/Uploads.controller'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { remoteImagesDtoSchema } from '~/shared/dtos/req/upload.dto'
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const uploadsRoute = Router()

uploadsRoute.post('/images', verifyAccessToken, wrapAsyncHandler(UploadsControllers.uploadImages))
uploadsRoute.post('/videos', verifyAccessToken, wrapAsyncHandler(UploadsControllers.uploadVideos))
uploadsRoute.delete(
  '/remove/images',
  requestBodyValidate(remoteImagesDtoSchema),
  wrapAsyncHandler(UploadsControllers.removeImages)
)

export default uploadsRoute
