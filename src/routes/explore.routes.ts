import { Router } from 'express'
import ExploreController from '~/controllers/Explore.controller'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const exploreRoute = Router()

exploreRoute.get(
  '/trending',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(ExploreController.getTrending)
)

exploreRoute.get(
  '/today-news',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(ExploreController.getTodayNews)
)

export default exploreRoute
