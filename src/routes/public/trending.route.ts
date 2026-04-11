import { Router } from 'express'
import trendingController from '~/controllers/public/trending.controller'
import { ParamIdTrendingDtoSchema } from '~/dtos/public/trending.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module TrendingRoutes
 * @description Quản lý các API liên quan đến chức năng trending, bao gồm lấy danh sách trending, lấy tin tức nổi bật trong ngày, lấy tin tức nổi bật trong tuần và báo cáo một trending cụ thể.
 */

const trendingRoute = Router()

/**
 * @description API để lấy danh sách các trending hiện tại. Kết quả trả về có thể bao gồm các trending đang hot, được sắp xếp theo mức độ phổ biến hoặc thời gian tạo.
 * @method GET
 * @route /api/trending
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
trendingRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(trendingController.getTrending))

/**
 * @description Sẽ tạo cron tổng hợp trending lưu lại
 * - Mỗi lần người dùng GET thì lấy từ database lên
 * - Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 * @method GET
 * @route /api/trending/today-news
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
trendingRoute.get(
  '/today-news',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(trendingController.getTodayNews)
)

/**
 * @description Sẽ tạo cron tổng hợp trending lưu lại
 * - Mỗi lần người dùng GET thì lấy từ database lên
 * - Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 * @method GET
 * @route /api/trending/outstanding-this-week
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
trendingRoute.get(
  '/outstanding-this-week',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(trendingController.getOutStandingThisWeekNews)
)

/**
 * @description Lấy danh sách trending (có authentication để biết user đã like/trending nào chưa)
 * - Nếu mở rộng thì chuyển sang POST (không theo chuẩn RESTFul api)
 * @method GET
 * @route /api/trending/tweets-by-ids
 * @access Private (có thể truy cập nếu không đăng nhập)
 */
trendingRoute.get(
  '/tweets-by-ids',
  optionLogin(authenticationUserMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(trendingController.getTweetsByIds)
)

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
trendingRoute.use(authenticationUserMiddleware)

/**
 * @description API để báo cáo một trending cụ thể. Người dùng có thể gửi báo cáo về một trending nếu họ cho rằng nó vi phạm các quy tắc cộng đồng hoặc có nội dung không phù hợp. Chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này.
 * @method PATCH
 * @route /api/trending/report/:trending_id
 * @access Private (chỉ những người dùng đã đăng nhập mới có thể thực hiện hành động này)
 */
trendingRoute.patch(
  '/report/:trending_id',
  paramsValidate(ParamIdTrendingDtoSchema),
  asyncHandler(trendingController.report)
)

export default trendingRoute
