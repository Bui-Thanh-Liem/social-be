import { Router } from 'express'
import UploadsControllers from '~/controllers/Uploads.controller'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { remoteImagesDtoSchema } from '~/shared/dtos/req/upload.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const uploadsRoute = Router()

uploadsRoute.post('/images', verifyAccessToken, wrapAsyncHandler(UploadsControllers.uploadImages))
uploadsRoute.post('/videos', verifyAccessToken, wrapAsyncHandler(UploadsControllers.uploadVideos))
uploadsRoute.delete(
  '/remove/images',
  requestBodyValidate(remoteImagesDtoSchema),
  wrapAsyncHandler(UploadsControllers.removeImages)
)

export default uploadsRoute
