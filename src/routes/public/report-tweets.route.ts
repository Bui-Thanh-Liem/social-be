import { Router } from 'express'
import reportTweetController from '~/controllers/public/report-tweets.controller'
import { paramIdTweetDtoSchema } from '~/dtos/public/tweets.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { checkTweetByIdParamsMiddleware } from '~/middlewares/tweet/check-tweet-params.middleware'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module ReportTweetRoutes
 * @description Quản lý các API liên quan đến việc báo cáo (report) các tweet vi phạm của người dùng, bao gồm tạo báo cáo và lấy danh sách các báo cáo đã gửi.
 */

const reportTweetRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
reportTweetRoute.use(authenticationUserMiddleware)

/**
 * @description API để tạo một báo cáo (report) cho một tweet cụ thể mà người dùng cho là vi phạm. Người dùng có thể cung cấp lý do báo cáo và các thông tin liên quan khác.
 * @method POST
 * @route /api/report-tweets/:tweet_id
 * @access Private
 */
reportTweetRoute.post(
  '/:tweet_id',
  paramsValidate(paramIdTweetDtoSchema),
  checkTweetByIdParamsMiddleware,
  asyncHandler(reportTweetController.report)
)

export default reportTweetRoute
