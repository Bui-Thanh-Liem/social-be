import { Router } from 'express'
import UploadsControllers from '~/controllers/Uploads.controller'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
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
uploadsRoute.delete('/images', asyncHandler(UploadsControllers.removeImages))

//
uploadsRoute.post('/signed/', asyncHandler(UploadsControllers.signedUrls))

export default uploadsRoute
