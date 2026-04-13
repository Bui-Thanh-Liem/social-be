import { Router } from 'express'
import accessRecentController from '~/controllers/public/access-recent.controller'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/common/body-validate.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { CreateAccessRecentDtoSchema } from '../../dtos/public/access-recent.dto'
import { optionLogin } from '~/middlewares/common/option-login.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'

/**
 * @module AccessRecentRoutes
 * @description Quản lý danh sách các mục đã truy cập gần đây của người dùng.
 */

const accessRecentRoute = Router()

accessRecentRoute
  .route('/')

  /**
   * @description API để lấy danh sách các mục đã truy cập gần đây của người dùng.
   * @method GET
   * @route /api/access-recents
   * @access Private
   */
  .get(
    queryValidate(QueryDtoSchema),
    optionLogin(authenticationUserMiddleware),
    asyncHandler(accessRecentController.getMulti)
  )

  /**
   * @description API để tạo một mục truy cập gần đây mới cho người dùng.
   * @method POST
   * @route /api/access-recent
   * @access Private
   */
  .post(
    bodyValidate(CreateAccessRecentDtoSchema),
    authenticationUserMiddleware,
    asyncHandler(accessRecentController.create)
  )

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
accessRecentRoute.use(authenticationUserMiddleware)

/**
 * @description API để xóa tất cả mục truy cập gần đây của người dùng.
 * @method DELETE
 * @route /api/access-recent/all
 * @access Private
 */
accessRecentRoute.delete('/all', asyncHandler(accessRecentController.deleteAll))

/**
 * @description API để xóa một mục truy cập gần đây của người dùng.
 * @method DELETE
 * @route /api/access-recent/:id
 * @access Private
 */
accessRecentRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(accessRecentController.delete))

export default accessRecentRoute
