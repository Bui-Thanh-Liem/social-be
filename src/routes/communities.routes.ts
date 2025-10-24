import { Router } from 'express'
import CommunityController from '~/controllers/Community.controller'
import { checkExistMembers } from '~/middlewares/checkExistMembers.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import {
  CreateCommunityDtoSchema,
  GetDetailBySlugDtoSchema,
  InvitationMembersDtoSchema
} from '~/shared/dtos/req/community.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const communitiesRoute = Router()

//
communitiesRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateCommunityDtoSchema),
  checkExistMembers,
  wrapAsyncHandler(CommunityController.create)
)

//
communitiesRoute.post(
  '/invite-members',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(InvitationMembersDtoSchema),
  checkExistMembers,
  wrapAsyncHandler(CommunityController.inviteMembers)
)

// Lấy categories của từng community (trả về danh sách)
communitiesRoute.get('/categories', verifyAccessToken, wrapAsyncHandler(CommunityController.getAllCategories))

// Lấy chi tiết một community theo slug
communitiesRoute.get(
  '/slug/:slug',
  verifyAccessToken,
  requestParamsValidate(GetDetailBySlugDtoSchema),
  wrapAsyncHandler(CommunityController.getOneBySlug)
)

//
communitiesRoute.get(
  '/',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(CommunityController.getMulti)
)

export default communitiesRoute
