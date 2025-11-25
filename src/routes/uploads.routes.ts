import { Router } from 'express'
import cloudinary from '~/configs/cloudinary.config'
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

//
uploadsRoute.post('/signed/', (req, res) => {
  const { public_ids } = req.body
  if (!public_ids || !Array.isArray(public_ids) || public_ids.length === 0) {
    return res.status(400).json({ message: 'public_ids is required and should be a non-empty array' })
  }

  const signatures = public_ids.map((public_id: string) => {
    return cloudinary.url(public_id, {
      secure: true, // luôn dùng HTTPS
      sign_url: true, // bắt buộc ký
      expires_at: Math.floor(Date.now() / 1000) + 900, // hết hạn sau 15 phút
      resource_type: 'auto' // tự nhận diện image/video/raw
    })
  })

  res.json({ urls: signatures })
})

export default uploadsRoute
