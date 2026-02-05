import { Router } from 'express'
import UploadController from '~/modules/uploads/upload.controller'
import { verifyAccessTokenAdmin } from '~/shared/middlewares/admin/verify-access-token-admin.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { paramIdMediaDtoSchema } from '~/shared/dtos/req/media.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const mediaRoute = Router()

mediaRoute.post(
  'remind/:media_id',
  verifyAccessTokenAdmin,
  requestParamsValidate(paramIdMediaDtoSchema),
  asyncHandler(UploadController.remind)
)
mediaRoute.post('remove', verifyAccessTokenAdmin, asyncHandler(UploadController.delete))

export default mediaRoute
