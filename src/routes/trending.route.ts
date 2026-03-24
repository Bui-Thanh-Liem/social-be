import { Router } from 'express'
import trendingController from '~/controllers/trending.controller'
import { ParamIdTrendingDtoSchema } from '~/dtos/trending.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const trendingRoute = Router()

// Lấy danh sách trending (không cần authentication)
trendingRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(trendingController.getTrending))

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get(
  '/today-news',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(trendingController.getTodayNews)
)

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get(
  '/outstanding-this-week',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(trendingController.getOutStandingThisWeekNews)
)

// Lấy danh sách trending (có authentication để biết user đã like/trending nào chưa)
// Nếu mở rộng thì chuyển sang POST (không theo chuẩn RESTFul api)
trendingRoute.get(
  '/tweets-by-ids',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  asyncHandler(trendingController.getTweetsByIds)
)

// Các route dưới đây cần authentication
trendingRoute.use(authenticationMiddleware)

// Báo cáo trending
trendingRoute.patch(
  '/report/:trending_id',
  paramsValidate(ParamIdTrendingDtoSchema),
  asyncHandler(trendingController.report)
)

export default trendingRoute
