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

trendingRoute.get(
  '/today-news',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TrendingController.getTodayNews)
)

trendingRoute.get(
  '/outstanding-this-week',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(TrendingController.getOutStandingThisWeekNews)
)

trendingRoute.patch(
  '/report/:trending_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ParamIdTrendingDtoSchema),
  wrapAsyncHandler(TrendingController.report)
)

export default trendingRoute
