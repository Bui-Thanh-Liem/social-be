import { Router } from 'express'
import TrendingController from '~/controllers/Trending.controller'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { ParamIdTrendingDtoSchema } from '~/shared/dtos/req/trending.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const trendingRoute = Router()

trendingRoute.get(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TrendingController.getTrending)
)

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get(
  '/today-news',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TrendingController.getTodayNews)
)

/**
 * Sẽ tạo cron tổng hợp trending lưu lại
 * Mỗi lần người dùng GET thì lấy từ database lên
 * Cách hiện tại mỗi lần GET thì query rất nhiều tweet rồi tổng hợp lại (không tối ưu)
 */
trendingRoute.get(
  '/outstanding-this-week',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TrendingController.getOutStandingThisWeekNews)
)

// Nếu mở rộng thì chuyển sang POST (không theo chuẩn RESTFul api)
trendingRoute.get(
  '/tweets-by-ids',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TrendingController.getTweetsByIds)
)

trendingRoute.patch(
  '/report/:trending_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ParamIdTrendingDtoSchema),
  wrapAsyncHandler(TrendingController.report)
)

export default trendingRoute
