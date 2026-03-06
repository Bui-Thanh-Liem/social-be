import { Router } from 'express'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import BadWordController from './bad-words.controller'
import { ActionBadWordDtoSchema, paramIdBadWordsDtoSchema } from './bad-words.dto'

const badWordsRoute = Router()

badWordsRoute.use(authenticationMiddleware)

badWordsRoute
  .route('/')
  .get(queryValidate(QueryDtoSchema), asyncHandler(BadWordController.getMulti))
  .post(bodyValidate(ActionBadWordDtoSchema), asyncHandler(BadWordController.create))

badWordsRoute.get('/most-used', queryValidate(QueryDtoSchema), asyncHandler(BadWordController.getMultiMostUsed))

badWordsRoute.patch(
  '/:bad_word_id',
  paramsValidate(paramIdBadWordsDtoSchema),
  bodyValidate(ActionBadWordDtoSchema),
  asyncHandler(BadWordController.update)
)

badWordsRoute.delete('/:bad_word_id', paramsValidate(paramIdBadWordsDtoSchema), asyncHandler(BadWordController.delete))

export default badWordsRoute
