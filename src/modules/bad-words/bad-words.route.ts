import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import BadWordController from './bad-words.controller'
import { ActionBadWordDtoSchema, paramIdBadWordsDtoSchema } from './bad-words.dto'

const badWordsRoute = Router()

// Tất cả route của bad-words đều cần authentication
badWordsRoute.use(authenticationMiddleware)

// CRUD bad-words
badWordsRoute
  .route('/')
  .get(queryValidate(QueryDtoSchema), asyncHandler(BadWordController.getMulti))
  .post(bodyValidate(ActionBadWordDtoSchema), asyncHandler(BadWordController.create))

// Lấy danh sách bad-words được sử dụng nhiều nhất (top 10)
badWordsRoute.get('/most-used', queryValidate(QueryDtoSchema), asyncHandler(BadWordController.getMultiMostUsed))

// Cập nhật bad-word
badWordsRoute.patch(
  '/:bad_word_id',
  paramsValidate(paramIdBadWordsDtoSchema),
  bodyValidate(ActionBadWordDtoSchema),
  asyncHandler(BadWordController.update)
)

// Xóa bad-word
badWordsRoute.delete('/:bad_word_id', paramsValidate(paramIdBadWordsDtoSchema), asyncHandler(BadWordController.delete))

export default badWordsRoute
