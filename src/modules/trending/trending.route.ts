import { Router } from 'express'
import { ParamIdTrendingDtoSchema } from '~/modules/trending/trending.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import TrendingController from './trending.controller'

const trendingRoute = Router()

trendingRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

trendingRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(TrendingController.getTrending))

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get('/today-news', queryValidate(QueryDtoSchema), asyncHandler(TrendingController.getTodayNews))

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get(
  '/outstanding-this-week',
  queryValidate(QueryDtoSchema),
  asyncHandler(TrendingController.getOutStandingThisWeekNews)
)

// Nếu mở rộng thì chuyển sang POST (không theo chuẩn RESTFul api)
trendingRoute.get('/tweets-by-ids', queryValidate(QueryDtoSchema), asyncHandler(TrendingController.getTweetsByIds))

trendingRoute.patch(
  '/report/:trending_id',
  paramsValidate(ParamIdTrendingDtoSchema),
  asyncHandler(TrendingController.report)
)

export default trendingRoute
