import { Router } from 'express'
import UploadsControllers from '~/controllers/Uploads.controller'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { remoteImagesDtoSchema } from '~/shared/dtos/req/upload.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const uploadsRoute = Router()

uploadsRoute.post('/images', wrapAsyncHandler(UploadsControllers.uploadImages))
uploadsRoute.post(
  '/remote/images',
  requestBodyValidate(remoteImagesDtoSchema),
  wrapAsyncHandler(UploadsControllers.remoteImages)
)
uploadsRoute.post('/videos', wrapAsyncHandler(UploadsControllers.uploadVideos))

export default uploadsRoute
