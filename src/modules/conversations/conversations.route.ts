import { Router } from 'express'
import ConversationsController from '~/modules/conversations/conversations.controller'
import { checkExistParticipants } from '~/shared/middlewares/community/check-exist-participants.middleware'
import { requestBodyValidate } from '~/shared/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import { ConversationIdDtoSchema, CreateConversationDtoSchema, ParticipantsDtoSchema } from './conversations.dto'

const conversationsRoute = Router()

conversationsRoute.use(verifyAccessToken, verifyUserEmail)

conversationsRoute.post(
  '/',
  requestBodyValidate(CreateConversationDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.create)
)

conversationsRoute.post(
  '/add-participants/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.addParticipants)
)

conversationsRoute.post(
  '/remove-participants/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.removeParticipants)
)

conversationsRoute.post(
  '/promote/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.promoteMentor)
)

conversationsRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(ConversationsController.getMulti))

conversationsRoute.patch(
  '/read/:conv_id',
  verifyAccessToken,
  requestParamsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.read)
)

conversationsRoute.patch(
  '/toggle-pin/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.togglePinConv)
)

conversationsRoute.delete(
  '/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.delete)
)

export default conversationsRoute
