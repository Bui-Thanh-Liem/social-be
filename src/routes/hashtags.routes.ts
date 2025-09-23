import { Router } from 'express'
import HashtagsController from '~/controllers/Hashtags.controller'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const hashtagsRoute = Router()

hashtagsRoute.get(
  '/',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(HashtagsController.getMulti)
)

export default hashtagsRoute
