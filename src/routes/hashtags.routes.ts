import { Router } from 'express'
import HashtagsController from '~/controllers/Hashtags.controller'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const hashtagsRoute = Router()

hashtagsRoute.get(
  '/',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(HashtagsController.getMulti)
)

export default hashtagsRoute
