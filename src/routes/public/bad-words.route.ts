import { Router } from 'express'
import badWordsController from '~/controllers/public/bad-words.controller'
import { ActionBadWordDtoSchema } from '~/dtos/public/bad-words.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module BadWordsRoutes
 * @description Quản lý danh sách các từ ngữ bị cấm (bad words) trong hệ thống, bao gồm tạo, cập nhật, xóa và lấy danh sách các từ ngữ này.
 */

const badWordsRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
badWordsRoute.use(authenticationUserMiddleware)

badWordsRoute
  .route('/')

  /**
   * @description API để lấy danh sách các từ ngữ bị cấm (bad words) trong hệ thống, có hỗ trợ phân trang và lọc.
   * @method GET
   * @route /api/bad-words
   * @access Private
   */
  .get(queryValidate(QueryDtoSchema), asyncHandler(badWordsController.getMulti))

  /**
   * @description API để tạo một từ ngữ bị cấm (bad word) mới trong hệ thống.
   * @method POST
   * @route /api/bad-words
   * @access Private
   */
  .post(bodyValidate(ActionBadWordDtoSchema), asyncHandler(badWordsController.create))

/**
 * @description API để lấy danh sách các từ ngữ bị cấm (bad words) được sử dụng nhiều nhất trong hệ thống.
 * @method GET
 * @route /api/bad-words/most-used
 * @access Private
 */
badWordsRoute.get('/most-used', queryValidate(QueryDtoSchema), asyncHandler(badWordsController.getMultiMostUsed))

/**
 * @description API để cập nhật thông tin của một từ ngữ bị cấm (bad word) cụ thể trong hệ thống.
 * @method PATCH
 * @route /api/bad-words/:id
 * @access Private
 */
badWordsRoute.patch(
  '/:id',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(ActionBadWordDtoSchema),
  asyncHandler(badWordsController.update)
)

/**
 * @description API để xóa một từ ngữ bị cấm (bad word) cụ thể khỏi hệ thống.
 * @method DELETE
 * @route /api/bad-words/:id
 * @access Private
 */
badWordsRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(badWordsController.delete))

export default badWordsRoute
