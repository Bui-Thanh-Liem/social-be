import { Router } from 'express'
import CommunityController from '~/controllers/Community.controller'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { CreateCommunityDtoSchema } from '~/shared/dtos/req/community.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const communitiesRoute = Router()

communitiesRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateCommunityDtoSchema),
  wrapAsyncHandler(CommunityController.create)
)

communitiesRoute.get('/categories', verifyAccessToken, wrapAsyncHandler(CommunityController.getAllCategories))

communitiesRoute.get(
  '/',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(CommunityController.getMulti)
)

export default communitiesRoute
