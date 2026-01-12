import { Router } from 'express'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import UploadsControllers from '~/controllers/Upload.controller'

const uploadsRoute = Router()

uploadsRoute.use(verifyAccessToken, verifyUserEmail)

//
uploadsRoute.post('/signed', asyncHandler(UploadsControllers.presignedURL))

//
uploadsRoute.post('/confirm', asyncHandler(UploadsControllers.confirmUpload))

//
uploadsRoute.delete('/', asyncHandler(UploadsControllers.delete))

export default uploadsRoute
