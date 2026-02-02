import { Router } from 'express'
import TrendingController from '~/controllers/Trending.controller'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/user/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { ParamIdTrendingDtoSchema } from '~/shared/dtos/req/trending.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const trendingRoute = Router()

trendingRoute.use(verifyAccessToken, verifyUserEmail)

trendingRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(TrendingController.getTrending))

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get('/today-news', requestQueryValidate(QueryDtoSchema), asyncHandler(TrendingController.getTodayNews))

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get(
  '/outstanding-this-week',
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TrendingController.getOutStandingThisWeekNews)
)

// Nếu mở rộng thì chuyển sang POST (không theo chuẩn RESTFul api)
trendingRoute.get(
  '/tweets-by-ids',
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(TrendingController.getTweetsByIds)
)

trendingRoute.patch(
  '/report/:trending_id',
  requestParamsValidate(ParamIdTrendingDtoSchema),
  asyncHandler(TrendingController.report)
)

export default trendingRoute
