import { Router } from 'express'
import UploadController from '~/controllers/Upload.controller'
import { verifyAccessTokenAdmin } from '~/middlewares/admin/verify-access-token-admin.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { paramIdMediaDtoSchema } from '~/shared/dtos/req/media.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const mediaRoute = Router()

// ====== ADMIN ONLY ======
mediaRoute.get('/', verifyAccessTokenAdmin, asyncHandler(UploadController.getMulti))
mediaRoute.post(
  'remind/:media_id',
  verifyAccessTokenAdmin,
  requestParamsValidate(paramIdMediaDtoSchema),
  asyncHandler(UploadController.remind)
)
mediaRoute.post('remove', verifyAccessTokenAdmin, asyncHandler(UploadController.delete))
// ========================

export default mediaRoute
