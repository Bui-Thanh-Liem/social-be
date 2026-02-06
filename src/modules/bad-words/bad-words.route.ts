import { Router } from 'express'
import { verifyAccessTokenAdmin } from '~/shared/middlewares/admin/verify-access-token-admin.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { ActionBadWordDtoSchema, paramIdBadWordsDtoSchema } from './bad-words.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import BadWordController from './bad-words.controller'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'

const badWordsRoute = Router()

badWordsRoute.use(verifyAccessTokenAdmin)

badWordsRoute
  .route('/')
  .get(requestQueryValidate(QueryDtoSchema), asyncHandler(BadWordController.getMulti))
  .post(requestBodyValidate(ActionBadWordDtoSchema), asyncHandler(BadWordController.create))

badWordsRoute.patch(
  '/:bad_word_id',
  requestParamsValidate(paramIdBadWordsDtoSchema),
  requestBodyValidate(ActionBadWordDtoSchema),
  asyncHandler(BadWordController.update)
)

badWordsRoute.delete(
  '/:bad_word_id',
  requestParamsValidate(paramIdBadWordsDtoSchema),
  asyncHandler(BadWordController.delete)
)

export default badWordsRoute
