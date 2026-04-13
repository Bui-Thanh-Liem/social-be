import { Router } from 'express'
import communitiesController from '~/controllers/public/communities.controller'
import { authenticationAdminMiddleware } from '~/middlewares/private/authentication-admin.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module privateCommunitiesRoute
 * @description Quản lý các API liên quan đến cộng đồng, bao gồm tạo, cập nhật, tham gia, rời khỏi cộng đồng, v.v.
 */

const privateCommunitiesRoute = Router()

privateCommunitiesRoute.use(authenticationAdminMiddleware)

privateCommunitiesRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(communitiesController.adminGetCommunities))

export default privateCommunitiesRoute
