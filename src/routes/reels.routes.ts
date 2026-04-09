import { Router } from 'express'
import reelsController from '~/controllers/reels.controller'
import { ChangeStatusReelDtoSchema, CreateReelDtoSchema } from '~/dtos/reels.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { optionLogin } from '~/middlewares/option-login.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'

const reelRoute = Router()

reelRoute.get(
  '/feeds',
  optionLogin(authenticationMiddleware),
  queryValidate(QueryDtoSchema),
  reelsController.getNewFeed
)

reelRoute.get(
  '/profile/:id',
  optionLogin(authenticationMiddleware),
  paramsValidate(ParamIdDtoSchema),
  queryValidate(QueryDtoSchema),
  reelsController.getProfileReels
)

// Tất cả route dưới đây đều cần authentication
reelRoute.use(authenticationMiddleware)

// Tạo reel mới
reelRoute.post('/', bodyValidate(CreateReelDtoSchema), reelsController.create)

// Thay đổi trạng thái reel
reelRoute.patch(
  '/:reel_id/status',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(ChangeStatusReelDtoSchema),
  reelsController.changeStatusReel
)

// Xóa reel
reelRoute.delete('/:reel_id', paramsValidate(ParamIdDtoSchema), reelsController.delete)

export default reelRoute
