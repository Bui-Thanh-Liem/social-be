import { Router } from 'express'
import UploadsControllers from '~/controllers/public/uploads.controller'
import { deleteMediaDtoSchema, presignedUrlDtoSchema, uploadConfirmDtoSchema } from '~/dtos/public/uploads.dto'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module UploadsRoutes
 * @description Quản lý các API liên quan đến việc upload media (hình ảnh, video) của người dùng, bao gồm lấy presigned URL để upload lên S3, xác nhận đã upload thành công và xóa media đã upload.
 */

const uploadsRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
uploadsRoute.use(authenticationUserMiddleware)

/**
 * @description API để lấy presigned URL từ server, cho phép người dùng upload media trực tiếp lên S3 mà không cần phải qua server. Người dùng sẽ gửi thông tin về loại media và kích thước file, server sẽ trả về presigned URL tương ứng.
 * @method POST
 * @route /api/uploads/presigned-url
 * @access Private
 */
uploadsRoute.post('/presigned-url', bodyValidate(presignedUrlDtoSchema), asyncHandler(UploadsControllers.presignedURL))

/**
 * @description API để xác nhận đã upload media thành công lên S3. Người dùng sẽ gửi thông tin về URL của media đã upload, server sẽ kiểm tra và lưu thông tin media vào database nếu hợp lệ.
 * @method POST
 * @route /api/uploads/confirm
 * @access Private
 */
uploadsRoute.post('/confirm', bodyValidate(uploadConfirmDtoSchema), asyncHandler(UploadsControllers.confirmUpload))

/**
 * @description API để xóa một media đã upload. Người dùng sẽ gửi thông tin về URL của media cần xóa, server sẽ kiểm tra và xóa media khỏi S3 và database nếu hợp lệ.
 * @method DELETE
 * @route /api/uploads
 * @access Private
 */
uploadsRoute.delete('/', bodyValidate(deleteMediaDtoSchema), asyncHandler(UploadsControllers.delete))

export default uploadsRoute
