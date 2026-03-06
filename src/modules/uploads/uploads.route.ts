import { Router } from 'express'
import UploadsControllers from '~/modules/uploads/uploads.controller'
import { deleteMediaDtoSchema, presignedUrlDtoSchema, uploadConfirmDtoSchema } from '~/modules/uploads/uploads.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const uploadsRoute = Router()

uploadsRoute.use(authenticationMiddleware)

//
uploadsRoute.post('/presigned-url', bodyValidate(presignedUrlDtoSchema), asyncHandler(UploadsControllers.presignedURL))

//
uploadsRoute.post('/confirm', bodyValidate(uploadConfirmDtoSchema), asyncHandler(UploadsControllers.confirmUpload))

//
uploadsRoute.delete('/', bodyValidate(deleteMediaDtoSchema), asyncHandler(UploadsControllers.delete))

export default uploadsRoute
