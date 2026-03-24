import { Router } from 'express'
import badWordsController from '~/controllers/bad-words.controller'
import { ActionBadWordDtoSchema, paramIdBadWordsDtoSchema } from '~/dtos/bad-words.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const badWordsRoute = Router()

// Tất cả route của bad-words đều cần authentication
badWordsRoute.use(authenticationMiddleware)

// CRUD bad-words
badWordsRoute
  .route('/')
  .get(queryValidate(QueryDtoSchema), asyncHandler(badWordsController.getMulti))
  .post(bodyValidate(ActionBadWordDtoSchema), asyncHandler(badWordsController.create))

// Lấy danh sách bad-words được sử dụng nhiều nhất (top 10)
badWordsRoute.get('/most-used', queryValidate(QueryDtoSchema), asyncHandler(badWordsController.getMultiMostUsed))

// Cập nhật bad-word
badWordsRoute.patch(
  '/:bad_word_id',
  paramsValidate(paramIdBadWordsDtoSchema),
  bodyValidate(ActionBadWordDtoSchema),
  asyncHandler(badWordsController.update)
)

// Xóa bad-word
badWordsRoute.delete('/:bad_word_id', paramsValidate(paramIdBadWordsDtoSchema), asyncHandler(badWordsController.delete))

export default badWordsRoute
