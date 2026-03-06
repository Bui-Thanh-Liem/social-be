import { Router } from 'express'
import UploadsControllers from '~/modules/uploads/uploads.controller'
import { deleteMediaDtoSchema, presignedUrlDtoSchema, uploadConfirmDtoSchema } from '~/modules/uploads/uploads.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

const uploadsRoute = Router()

// Các route dưới đây cần authentication
uploadsRoute.use(authenticationMiddleware)

// Lấy presigned URL để upload media lên S3
uploadsRoute.post('/presigned-url', bodyValidate(presignedUrlDtoSchema), asyncHandler(UploadsControllers.presignedURL))

// Xác nhận đã upload media lên S3 thành công và lưu thông tin media vào database
uploadsRoute.post('/confirm', bodyValidate(uploadConfirmDtoSchema), asyncHandler(UploadsControllers.confirmUpload))

// Xóa media đã upload (nếu có lỗi hoặc user hủy upload)
uploadsRoute.delete('/', bodyValidate(deleteMediaDtoSchema), asyncHandler(UploadsControllers.delete))

export default uploadsRoute
